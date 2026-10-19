'use client'

import { useFormContext } from 'react-hook-form'
import { Eye, Check, ChevronLeft, ChevronRight, MapPin, Bed, Bath, CheckCircle2, Home, Maximize, Hash, FileText } from 'lucide-react'
import type { PropertyFormData } from '../schema'
import InspectionContact from '../InspectionContact'
import { getInspectionContactInput, type OwnerInspectionContact } from '@/lib/inspection-contact'

interface Step6PreviewProps {
  imageFiles: File[]
  ownerContact?: OwnerInspectionContact
}

export default function Step6Preview({ imageFiles, ownerContact = null }: Step6PreviewProps) {
  const { watch } = useFormContext<PropertyFormData>()
  const formValues = watch()
  const inspectionContact = getInspectionContactInput(formValues, ownerContact)

  // Determine categories
  const isRent = formValues.listingType === 'RENTAL'
  const isSale = formValues.listingType === 'SALE'
  const isShortlet = formValues.listingType === 'SHORTLET'
  const isLand = formValues.propertyType === 'LAND'
  const isApartment = formValues.propertyType === 'APARTMENT'
  const isHouse = formValues.propertyType === 'HOUSE'

  const activeBedroomTypes = formValues.bedroomTypes || []
  const isMultiUnitRent = isRent && isApartment && activeBedroomTypes.length > 0

  const addressStr = formValues.address || 'Address not specified'

  // Smart Title Generation
  let displayTitle = 'Untitled Property'
  
  if (isRent && isApartment) {
    const beds = (formValues.bedroomTypes && formValues.bedroomTypes.length > 0)
      ? formValues.bedroomTypes.join(', ')
      : 'Apartment'
    displayTitle = `${beds} available for rent in ${addressStr}`
  } else if (isRent && isLand) {
    displayTitle = `Land for rent in ${addressStr}`
  } else if (isSale) {
    const pType = isHouse ? 'House' : isLand ? 'Land' : formValues.propertyType.toLowerCase()
    displayTitle = `${pType} for sale in ${addressStr}`
  } else if (isShortlet) {
    const sBed = formValues.shortletBedrooms || 'Apartment'
    displayTitle = `${sBed} available for shortlet in ${addressStr}`
  } else {
    displayTitle = `${formValues.propertyType.toLowerCase()} in ${addressStr}`
  }

  // Smart Description Routing
  const descriptionText = isSale ? formValues.title : formValues.description
  const isValidDescription = descriptionText && !descriptionText.startsWith('Standard') && !descriptionText.startsWith('Please provide')

  // Format Price & Suffix
  let priceSuffix = ''
  if (isRent) priceSuffix = `/ ${formValues.tenancyDuration?.toLowerCase() || 'year'}`
  if (isShortlet) priceSuffix = '/ night'

  // Standard Rent Calculations for preview (matching Step 3 logic)
  const basePrice = Number(formValues.basePrice) || 0
  const cautionFee = Number(formValues.cautionFee) || 0
  const agreementFee = basePrice * 0.20
  const platformFee = basePrice * 0.20
  const totalStandardRent = basePrice + cautionFee + agreementFee + platformFee

  return (
    <div className="space-y-6 -mx-4 px-4 md:mx-0 md:px-0 mt-2">
      
      {/* Preview Banner */}
      <div className="p-4 bg-[#FFF8E6] border border-[#FDE68A] rounded-2xl flex items-start gap-3 shadow-sm">
        <Eye className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
        <div>
          <p className="text-[14px] font-bold text-[#92400E]">Preview Mode</p>
          <p className="text-[12px] text-[#B45309] mt-1 leading-relaxed">This is how your property will look to potential clients once verified.</p>
        </div>
      </div>

      <div className="space-y-6 pb-4 border-b border-gray-100">
        
        {/* Media Gallery */}
        <div className="space-y-3">
          <div className="w-full h-[260px] bg-gray-200 rounded-2xl overflow-hidden relative shadow-sm">
            {imageFiles[0] ? (
              <img src={URL.createObjectURL(imageFiles[0])} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#E8F5E9] flex items-center justify-center text-[#005C3A] font-bold text-sm">No Image Provided</div>
            )}
            <div className="absolute top-4 right-4 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center"><Check className="w-5 h-5 text-[#005C3A]"/></div>
            <div className="absolute bottom-4 right-4 bg-black/60 text-white text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-md">1 / {Math.max(imageFiles.length, 1)}</div>
            <div className="absolute top-1/2 left-4 -translate-y-1/2 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-md"><ChevronLeft className="w-5 h-5 text-white" /></div>
            <div className="absolute top-1/2 right-4 -translate-y-1/2 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-md"><ChevronRight className="w-5 h-5 text-white" /></div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[1,2,3,4].map((i) => (
              <div key={i} className="aspect-[4/3] bg-gray-100 rounded-xl relative overflow-hidden border border-gray-200">
                {imageFiles[i] && <img src={URL.createObjectURL(imageFiles[i])} className="w-full h-full object-cover" />}
                {i === 4 && imageFiles.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-lg backdrop-blur-sm">
                    +{imageFiles.length - 4}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Title & Price */}
        <div>
          <h3 className="text-[20px] font-extrabold text-[#091F11] leading-[1.3] mb-3 capitalize">{displayTitle}</h3>
          <div className="flex items-center gap-3">
             <p className="text-[#005C3A] font-extrabold text-[22px]">
               {isMultiUnitRent && <span className="text-[13px] font-medium text-gray-500 block -mb-1 mt-1">Starting from</span>}
               ₦{formValues.basePrice?.toLocaleString() || '0'} <span className="text-[13px] font-normal text-gray-500">{priceSuffix}</span>
             </p>
             <span className="px-3 py-1 bg-[#F0FDF4] text-[#005C3A] text-[11px] font-bold rounded-[8px] uppercase tracking-wide">
               For {formValues.listingType.toLowerCase()}
             </span>
          </div>

          {/* PREVIEW: Financial Breakdown for Single Unit Rent */}
          {isRent && !isMultiUnitRent && (
            <div className="mt-5 p-4 bg-[#F8FAFC] border border-gray-100 rounded-[14px] space-y-3">
              <h4 className="text-[13px] font-extrabold text-[#091F11] mb-1">Financial Breakdown</h4>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-gray-500">Rent (Base)</span>
                <span className="font-bold text-[#091F11]">₦{basePrice.toLocaleString()}</span>
              </div>
              {cautionFee > 0 && (
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-gray-500">Caution Fee</span>
                  <span className="font-bold text-[#091F11]">₦{cautionFee.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-gray-500">Agreement Fee (20%)</span>
                <span className="font-bold text-[#091F11]">₦{agreementFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-gray-500">Platform Fee (20%)</span>
                <span className="font-bold text-[#091F11]">₦{platformFee.toLocaleString()}</span>
              </div>
              <div className="pt-3 mt-1 border-t border-gray-200 flex justify-between items-center">
                <span className="text-[14px] font-extrabold text-[#091F11]">Total First Payment</span>
                <span className="text-[16px] font-extrabold text-[#005C3A]">₦{totalStandardRent.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* PREVIEW: Unit Breakdown for Multi-Unit Rent */}
          {isMultiUnitRent && formValues.unitPrices && (
            <div className="mt-5 space-y-3">
              <h4 className="text-[14px] font-extrabold text-[#091F11] mb-2 border-b border-gray-100 pb-2">Available Units & Pricing</h4>
              {Object.entries(formValues.unitPrices).map(([type, price]) => {
                const uPrice = Number(price)
                if (uPrice <= 0) return null
                const uAgreement = uPrice * 0.20
                const uPlatform = uPrice * 0.20
                const uTotal = uPrice + cautionFee + uAgreement + uPlatform

                return (
                  <div key={type} className="p-4 bg-[#F8FAFC] border border-gray-100 rounded-[14px] space-y-2">
                    <div className="flex justify-between items-center text-[14px] mb-1">
                      <span className="font-extrabold text-[#091F11] capitalize">{type} Rent</span>
                      <span className="font-extrabold text-[#005C3A]">₦{uPrice.toLocaleString()} {priceSuffix}</span>
                    </div>
                    {cautionFee > 0 && (
                      <div className="flex justify-between items-center text-[12px]">
                        <span className="text-gray-500">Caution Fee</span>
                        <span className="font-medium text-[#091F11]">₦{cautionFee.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[12px]">
                      <span className="text-gray-500">Agreement Fee (20%)</span>
                      <span className="font-medium text-[#091F11]">₦{uAgreement.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[12px]">
                      <span className="text-gray-500">Platform Fee (20%)</span>
                      <span className="font-medium text-[#091F11]">₦{uPlatform.toLocaleString()}</span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center">
                      <span className="text-[12px] font-bold text-[#091F11]">Total First Payment</span>
                      <span className="text-[14px] font-bold text-[#005C3A]">₦{uTotal.toLocaleString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Dynamic Structure Features Row (Hidden for Sale House) */}
        {(!isSale || isLand) && (
          <div className="flex justify-between items-center py-5 border-y border-gray-100 px-2">
            {isLand ? (
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <Maximize className="w-5 h-5 text-gray-400" />
                <span className="text-[11px] font-medium text-gray-500"><b className="text-[#091F11]">{formValues.size || 0}</b> sqm</span>
              </div>
            ) : isRent && isApartment ? (
              <>
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <Hash className="w-5 h-5 text-gray-400" />
                  <span className="text-[11px] font-medium text-gray-500"><b className="text-[#091F11]">{formValues.totalUnits || 0}</b> Total Units</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 flex-1 border-l border-gray-100">
                  <CheckCircle2 className="w-5 h-5 text-[#005C3A]" />
                  <span className="text-[11px] font-medium text-gray-500"><b className="text-[#091F11]">{formValues.availableUnits || 0}</b> Available</span>
                </div>
              </>
            ) : isShortlet ? (
              <>
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <Bed className="w-5 h-5 text-gray-400" />
                  <span className="text-[11px] font-medium text-gray-500"><b className="text-[#091F11]">{formValues.shortletBedrooms?.split(' ')[0] || 0}</b> Bed</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 flex-1 border-l border-gray-100">
                  <Bath className="w-5 h-5 text-gray-400" />
                  <span className="text-[11px] font-medium text-gray-500"><b className="text-[#091F11]">{formValues.bathrooms || 0}</b> Bath</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 flex-1 border-l border-gray-100">
                  <Home className="w-5 h-5 text-gray-400" />
                  <span className="text-[11px] font-medium text-gray-500"><b className="text-[#091F11]">{formValues.toilets || 0}</b> Toilet</span>
                </div>
              </>
            ) : null}
          </div>
        )}

        <InspectionContact name={inspectionContact.name} phone={inspectionContact.phone} />

        {/* Description */}
        {isValidDescription && (
          <div className={(!isSale || isLand) ? "" : "pt-4 border-t border-gray-100"}>
            <h4 className="font-extrabold text-[#091F11] text-[15px] mb-2">Property Description</h4>
            <p className="text-[14px] text-gray-600 leading-[1.7] whitespace-pre-wrap">{descriptionText}</p>
          </div>
        )}

        {/* Verified Documents (Sale Only) */}
        {isSale && formValues.documents && formValues.documents.length > 0 && (
          <div>
            <h4 className="font-extrabold text-[#091F11] text-[15px] mb-3">Available Legal Documents</h4>
            <div className="flex flex-wrap gap-2">
              {formValues.documents.map((doc: string) => (
                <span key={doc} className="px-3 py-1.5 bg-[#F0FDF4] border border-[#BBF7D0] text-[#005C3A] text-[11px] font-bold rounded-full flex items-center gap-1.5 shadow-sm">
                  <FileText className="w-3.5 h-3.5" /> {doc}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Location Map Placeholder */}
        <div>
           <h4 className="font-extrabold text-[#091F11] text-[15px] mb-3">Location</h4>
           <p className="text-[13px] text-gray-600 mb-3 flex items-center gap-1.5">
              <MapPin className="w-[14px] h-[14px] text-[#005C3A]" /> {addressStr}
           </p>
           <div className="w-full h-36 bg-gray-200 rounded-2xl relative overflow-hidden shadow-sm">
              <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800')"}}></div>
              <div className="absolute inset-0 bg-[#005C3A]/10 mix-blend-multiply"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full shadow-lg backdrop-blur-sm">
                <MapPin className="w-7 h-7 text-[#005C3A]" />
              </div>
           </div>
        </div>
      </div>
      
      {/* If your "Submit for Verification" button is down here, keep it! */}
    </div>
  )
}