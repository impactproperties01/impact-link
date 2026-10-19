'use client'

import { ChevronLeft, ChevronRight, MapPin, Bed, Bath, CheckCircle2, Home, Maximize, Hash, FileText, Check } from 'lucide-react'
import Link from 'next/link'

export default function PropertyViewClient({ property }: { property: any }) {
  const isRent = property.listingType === 'RENTAL'
  const isSale = property.listingType === 'SALE'
  const isShortlet = property.listingType === 'SHORTLET'
  const isLand = property.propertyType === 'LAND'
  const isApartment = property.propertyType === 'APARTMENT'
  const isHouse = property.propertyType === 'HOUSE'

  const activeBedroomTypes = property.bedroomTypes || []
  const isMultiUnitRent = isRent && isApartment && activeBedroomTypes.length > 0

  const addressStr = property.address || 'Address not specified'
  const images = property.images && property.images.length > 0 ? property.images : ['/hero-image.png']

  // Smart Title Generation
  let displayTitle = 'Untitled Property'
  if (isRent && isApartment) {
    const beds = (property.bedroomTypes && property.bedroomTypes.length > 0) ? property.bedroomTypes.join(', ') : 'Apartment'
    displayTitle = `${beds} available for rent in ${addressStr}`
  } else if (isRent && isLand) {
    displayTitle = `Land for rent in ${addressStr}`
  } else if (isSale) {
    const pType = isHouse ? 'House' : isLand ? 'Land' : property.propertyType.toLowerCase()
    displayTitle = `${pType} for sale in ${addressStr}`
  } else if (isShortlet) {
    const sBed = property.shortletBedrooms || 'Apartment'
    displayTitle = `${sBed} available for shortlet in ${addressStr}`
  } else {
    displayTitle = `${property.propertyType.toLowerCase()} in ${addressStr}`
  }

  // Smart Description Routing
  const descriptionText = isSale ? property.title : property.description
  const isValidDescription = descriptionText && !descriptionText.startsWith('Standard') && !descriptionText.startsWith('Please provide')

  let priceSuffix = ''
  if (isRent) priceSuffix = `/ ${property.tenancyDuration?.toLowerCase() || 'year'}`
  if (isShortlet) priceSuffix = '/ night'

  // Standard Rent Calculations
  const basePrice = Number(property.basePrice) || 0
  const cautionFee = Number(property.cautionFee) || 0
  const agreementFee = property.legalFee || (basePrice * 0.20)
  const platformFee = property.commissionPct || (basePrice * 0.20)
  const totalStandardRent = basePrice + (property.serviceCharge || 0) + cautionFee + agreementFee + platformFee + (property.agencyFee || 0)

  return (
    // UPDATED: Desktop width expanded to max-w-6xl
    <div className="max-w-[480px] lg:max-w-6xl mx-auto bg-white min-h-screen pb-24 font-sans">
      
      {/* Top Nav */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 sticky top-0 bg-white z-20">
        <Link href="/dashboard/properties" className="p-2 -ml-2 rounded-full hover:bg-gray-50 transition-colors">
          <ChevronLeft className="w-6 h-6 text-[#091F11]" />
        </Link>
        <h1 className="text-[17px] font-extrabold text-[#091F11]">Property Details</h1>
      </div>

      <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
        {/* Status Banner */}
        <div className={`p-4 rounded-2xl flex items-start gap-3 shadow-sm border ${
          property.status === 'VERIFIED' ? 'bg-[#F0FDF4] border-[#BBF7D0]' : 
          property.status === 'PENDING' ? 'bg-[#FFF8E6] border-[#FDE68A]' : 
          'bg-gray-50 border-gray-200'
        }`}>
          <div className="mt-0.5">
            {property.status === 'VERIFIED' ? <CheckCircle2 className="w-5 h-5 text-[#005C3A]" /> : 
             property.status === 'PENDING' ? <div className="w-2.5 h-2.5 rounded-full bg-[#D97706] m-1.5" /> : 
             <div className="w-2.5 h-2.5 rounded-full bg-gray-400 m-1.5" />}
          </div>
          <div>
            <p className={`text-[14px] font-bold ${
              property.status === 'VERIFIED' ? 'text-[#005C3A]' : 
              property.status === 'PENDING' ? 'text-[#92400E]' : 
              'text-gray-700'
            }`}>
              {property.status === 'VERIFIED' ? 'Verified & Live' : 
               property.status === 'PENDING' ? 'Pending Verification' : 
               'Draft / Inactive'}
            </p>
            <p className={`text-[12px] mt-1 leading-relaxed ${
              property.status === 'VERIFIED' ? 'text-[#005C3A]/80' : 
              property.status === 'PENDING' ? 'text-[#B45309]' : 
              'text-gray-500'
            }`}>
              {property.status === 'VERIFIED' ? 'This property is visible to potential clients.' : 
               property.status === 'PENDING' ? 'Our team is reviewing this listing. It will be live soon.' : 
               'This property is not currently visible to the public.'}
            </p>
          </div>
        </div>

        {/* 
          DESKTOP GRID STRUCTURE 
          Left Column (col-span-2): Gallery, Details, Map
          Right Column (col-span-1): Pricing & Financials 
        */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT COLUMN: Gallery & Info */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-10">
            
            {/* Title (Mobile & Desktop) */}
            <div>
              <h3 className="text-[20px] lg:text-[28px] font-extrabold text-[#091F11] leading-[1.3] mb-3 capitalize">
                {displayTitle}
              </h3>
              
              {/* MOBILE ONLY PRICE HEADER (Hidden on desktop because it moves to the right sidebar) */}
              <div className="flex lg:hidden items-center gap-3">
                 <p className="text-[#005C3A] font-extrabold text-[22px]">
                   {isMultiUnitRent && <span className="text-[13px] font-medium text-gray-500 block -mb-1 mt-1">Starting from</span>}
                   ₦{basePrice.toLocaleString()} <span className="text-[13px] font-normal text-gray-500">{priceSuffix}</span>
                 </p>
                 <span className="px-3 py-1 bg-[#F0FDF4] text-[#005C3A] text-[11px] font-bold rounded-[8px] uppercase tracking-wide">
                   For {property.listingType.toLowerCase()}
                 </span>
              </div>
            </div>

            {/* Media Gallery */}
            <div className="space-y-3">
              {/* Taller main image on desktop */}
              <div className="w-full h-[260px] lg:h-[480px] bg-gray-200 rounded-2xl overflow-hidden relative shadow-sm">
                <img src={images[0]} alt="Main property" className="w-full h-full object-cover" crossOrigin="anonymous" />
                <div className="absolute bottom-4 right-4 bg-black/60 text-white text-[11px] lg:text-[13px] font-bold px-3 py-1 rounded-full backdrop-blur-md">
                  1 / {images.length}
                </div>
              </div>
              
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-3 lg:gap-4">
                  {images.slice(0, 4).map((img: string, i: number) => (
                    <div key={i} className="aspect-[4/3] lg:aspect-video bg-gray-100 rounded-xl relative overflow-hidden border border-gray-200">
                      <img src={img} alt={`Thumbnail ${i}`} className="w-full h-full object-cover" crossOrigin="anonymous" />
                      {i === 3 && images.length > 4 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-lg backdrop-blur-sm">
                          +{images.length - 4}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dynamic Structure Features Row */}
            {(!isSale || isLand) && (
              <div className="flex justify-between items-center py-5 lg:py-6 border-y border-gray-100 px-2 lg:px-6 bg-gray-50 lg:rounded-2xl lg:border">
                {isLand ? (
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <Maximize className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400" />
                    <span className="text-[11px] lg:text-[13px] font-medium text-gray-500"><b className="text-[#091F11]">{property.size || 0}</b> sqm</span>
                  </div>
                ) : isRent && isApartment ? (
                  <>
                    <div className="flex flex-col items-center gap-1.5 flex-1">
                      <Hash className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400" />
                      <span className="text-[11px] lg:text-[13px] font-medium text-gray-500"><b className="text-[#091F11]">{property.totalUnits || 0}</b> Total Units</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 flex-1 border-l border-gray-200">
                      <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6 text-[#005C3A]" />
                      <span className="text-[11px] lg:text-[13px] font-medium text-gray-500"><b className="text-[#091F11]">{property.availableUnits || 0}</b> Available</span>
                    </div>
                  </>
                ) : isShortlet ? (
                  <>
                    <div className="flex flex-col items-center gap-1.5 flex-1">
                      <Bed className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400" />
                      <span className="text-[11px] lg:text-[13px] font-medium text-gray-500"><b className="text-[#091F11]">{property.shortletBedrooms?.split(' ')[0] || 0}</b> Bed</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 flex-1 border-l border-gray-200">
                      <Bath className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400" />
                      <span className="text-[11px] lg:text-[13px] font-medium text-gray-500"><b className="text-[#091F11]">{property.bathrooms || 0}</b> Bath</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 flex-1 border-l border-gray-200">
                      <Home className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400" />
                      <span className="text-[11px] lg:text-[13px] font-medium text-gray-500"><b className="text-[#091F11]">{property.toilets || 0}</b> Toilet</span>
                    </div>
                  </>
                ) : null}
              </div>
            )}

            {/* Description */}
            {isValidDescription && (
              <div className={(!isSale || isLand) ? "" : "pt-4 lg:pt-0 lg:border-t-0 border-t border-gray-100"}>
                <h4 className="font-extrabold text-[#091F11] text-[15px] lg:text-[18px] mb-3">Property Description</h4>
                <p className="text-[14px] lg:text-[15px] text-gray-600 leading-[1.8] whitespace-pre-wrap">{descriptionText}</p>
              </div>
            )}

            {/* Verified Documents (Sale Only) */}
            {isSale && property.documents && property.documents.length > 0 && (
              <div>
                <h4 className="font-extrabold text-[#091F11] text-[15px] lg:text-[18px] mb-4">Legal Documents</h4>
                <div className="flex flex-wrap gap-2 lg:gap-3">
                  {property.documents.map((doc: string) => (
                    <span key={doc} className="px-4 py-2 bg-[#F0FDF4] border border-[#BBF7D0] text-[#005C3A] text-[12px] lg:text-[13px] font-bold rounded-full flex items-center gap-2 shadow-sm">
                      <FileText className="w-4 h-4" /> {doc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Location Map Placeholder */}
            <div>
               <h4 className="font-extrabold text-[#091F11] text-[15px] lg:text-[18px] mb-3">Location</h4>
               <p className="text-[13px] lg:text-[15px] text-gray-600 mb-4 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#005C3A]" /> {addressStr}
               </p>
               <div className="w-full h-36 lg:h-[300px] bg-gray-200 rounded-2xl relative overflow-hidden shadow-sm">
                  <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800')"}}></div>
                  <div className="absolute inset-0 bg-[#005C3A]/10 mix-blend-multiply"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 p-4 rounded-full shadow-lg backdrop-blur-sm">
                    <MapPin className="w-8 h-8 text-[#005C3A]" />
                  </div>
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Financials Sidebar */}
          <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-6">
            
            <div className="lg:bg-white lg:border lg:border-gray-200 lg:rounded-[24px] lg:p-6 lg:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              
              {/* DESKTOP ONLY PRICE HEADER (Replaces the mobile header hiding at the top) */}
              <div className="hidden lg:block mb-6 pb-6 border-b border-gray-100">
                {isMultiUnitRent && <span className="text-[14px] font-medium text-gray-500 block mb-1">Starting from</span>}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[#005C3A] font-extrabold text-[28px]">₦{basePrice.toLocaleString()}</span>
                  <span className="text-[15px] font-normal text-gray-500 mt-1.5">{priceSuffix}</span>
                </div>
                <span className="inline-block mt-3 px-3 py-1 bg-[#F0FDF4] text-[#005C3A] text-[12px] font-bold rounded-[8px] uppercase tracking-wide">
                  For {property.listingType.toLowerCase()}
                </span>
              </div>

              {/* Financial Breakdown for Standard Rent */}
              {isRent && !isMultiUnitRent && (
                <div className="p-4 lg:p-5 bg-[#F8FAFC] border border-gray-100 rounded-[14px] space-y-3 lg:space-y-4">
                  <h4 className="text-[13px] lg:text-[15px] font-extrabold text-[#091F11] mb-1">Financial Breakdown</h4>
                  
                  <div className="flex justify-between items-center text-[13px] lg:text-[14px]">
                    <span className="text-gray-500">Rent (Base)</span>
                    <span className="font-bold text-[#091F11]">₦{basePrice.toLocaleString()}</span>
                  </div>

                  {!!property.serviceCharge && (
                    <div className="flex justify-between items-center text-[13px] lg:text-[14px]">
                      <span className="text-gray-500">Service Charge</span>
                      <span className="font-bold text-[#091F11]">₦{property.serviceCharge.toLocaleString()}</span>
                    </div>
                  )}

                  {!!property.cautionFee && (
                    <div className="flex justify-between items-center text-[13px] lg:text-[14px]">
                      <span className="text-gray-500">Caution Fee (Refundable)</span>
                      <span className="font-bold text-[#091F11]">₦{property.cautionFee.toLocaleString()}</span>
                    </div>
                  )}

                  {!!property.legalFee && (
                    <div className="flex justify-between items-center text-[13px] lg:text-[14px]">
                      <span className="text-gray-500">Legal / Agreement Fee</span>
                      <span className="font-bold text-[#091F11]">₦{property.legalFee.toLocaleString()}</span>
                    </div>
                  )}

                  {!!property.agencyFee && (
                    <div className="flex justify-between items-center text-[13px] lg:text-[14px]">
                      <span className="text-gray-500">Agency Fee</span>
                      <span className="font-bold text-[#091F11]">₦{property.agencyFee.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="pt-3 lg:pt-4 mt-1 lg:mt-2 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-[14px] lg:text-[16px] font-extrabold text-[#091F11]">Total First Payment</span>
                    <span className="text-[16px] lg:text-[18px] font-extrabold text-[#005C3A]">
                      ₦{totalStandardRent.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Unit Breakdown for Multi-Unit Rent */}
              {isMultiUnitRent && property.unitPrices && (
                <div className="space-y-3">
                  <h4 className="text-[14px] lg:text-[16px] font-extrabold text-[#091F11] mb-2 lg:mb-4 border-b border-gray-100 pb-2">Available Units & Pricing</h4>
                  {Object.entries(property.unitPrices).map(([type, price]) => {
                    const uPrice = Number(price)
                    if (uPrice <= 0) return null
                    const uAgreement = uPrice * 0.20
                    const uPlatform = uPrice * 0.20
                    const uTotal = uPrice + cautionFee + uAgreement + uPlatform

                    return (
                      <div key={type} className="p-4 lg:p-5 bg-[#F8FAFC] border border-gray-100 rounded-[14px] space-y-2 lg:space-y-3">
                        <div className="flex justify-between items-center text-[14px] lg:text-[15px] mb-1">
                          <span className="font-extrabold text-[#091F11] capitalize">{type} Rent</span>
                          <span className="font-extrabold text-[#005C3A]">₦{uPrice.toLocaleString()} {priceSuffix}</span>
                        </div>
                        {cautionFee > 0 && (
                          <div className="flex justify-between items-center text-[12px] lg:text-[13px]">
                            <span className="text-gray-500">Caution Fee</span>
                            <span className="font-medium text-[#091F11]">₦{cautionFee.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-[12px] lg:text-[13px]">
                          <span className="text-gray-500">Agreement Fee (20%)</span>
                          <span className="font-medium text-[#091F11]">₦{uAgreement.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[12px] lg:text-[13px]">
                          <span className="text-gray-500">Platform Fee (20%)</span>
                          <span className="font-medium text-[#091F11]">₦{uPlatform.toLocaleString()}</span>
                        </div>
                        <div className="pt-2 lg:pt-3 mt-2 lg:mt-3 border-t border-gray-200 flex justify-between items-center">
                          <span className="text-[12px] lg:text-[14px] font-bold text-[#091F11]">Total First Payment</span>
                          <span className="text-[14px] lg:text-[16px] font-bold text-[#005C3A]">₦{uTotal.toLocaleString()}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Placeholder Action Button for Desktop (Just a visual anchor if there are no breakdowns) */}
              {!isRent && (
                <div className="hidden lg:flex w-full mt-4 p-4 bg-[#F8FAFC] border border-gray-100 rounded-[14px] items-center justify-center text-gray-500 text-[14px] font-medium">
                   Financial details hidden for {property.listingType.toLowerCase()}s.
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}