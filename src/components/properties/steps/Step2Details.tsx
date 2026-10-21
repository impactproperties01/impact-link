'use client'

import { useFormContext } from 'react-hook-form'
import { Bed, Bath, Car, Info, ChevronRight, Home, Maximize, Hash, Check } from 'lucide-react'
import type { PropertyFormData } from '../schema'

const RENT_APARTMENT_BEDROOMS = ['Single room', 'Room self contained', 'Room and Parlor Flat', '2-bedroom Flat', '3-bedroom Flat', '4-Bedroom Flat']
const SHORTLET_APARTMENT_BEDROOMS = ['1 bedroom', '2-bedrooms', '3-bedroom', '4-bedrooms', '5-bedrooms']

export default function Step2Details() {
  const { register, watch, setValue, getValues, formState: { errors } } = useFormContext<PropertyFormData>()
  const formValues = watch()

  // Determine active conditions
  const isRentApartment = formValues.listingType === 'RENTAL' && formValues.propertyType === 'APARTMENT'
  const isLand = formValues.propertyType === 'LAND' 
  const isSellHouse = formValues.listingType === 'SALE' && formValues.propertyType === 'HOUSE'
  const isShortletApartment = formValues.listingType === 'SHORTLET' && formValues.propertyType === 'APARTMENT'
  const isLease = formValues.listingType === 'LEASE'
  const isCommercialLease = isLease && formValues.propertyType === 'COMMERCIAL'

  // Handle Multiple Selection for Rent/Apartment Bedrooms
  const toggleBedroomType = (type: string) => {
    const current = getValues('bedroomTypes') || []
    const updated = current.includes(type) ? current.filter((t: string) => t !== type) : [...current, type]
    setValue('bedroomTypes', updated)
  }

  return (
    <div className="space-y-0 -mx-4 md:mx-0">
      
      {/* Edge-to-Edge Image Header */}
      <div className="w-full h-[280px] relative overflow-hidden md:rounded-2xl">
        <img 
          src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1000" 
          alt="Property Header" 
          className="w-full h-full object-cover" 
        />
      </div>
      
      <div className="bg-white relative -mt-8 rounded-t-[2rem] pt-8 px-4 md:px-6 shadow-sm">
        <h2 className="text-[22px] font-extrabold text-[#091F11] mb-1">Property Structure</h2>
        <p className="text-gray-500 text-[14px] mb-8">Provide the key details about the structure.</p>

        {isLease && (
          <div className="p-4 mb-6 bg-gray-50 border border-gray-100 rounded-2xl">
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Property Description (From Step 1)</label>
            <p className="text-[14px] font-medium text-[#091F11]">{formValues.title || 'No description provided.'}</p>
          </div>
        )}

        {/* 1. RENT / APARTMENT */}
        {isRentApartment && (
          <div className="space-y-6">
            <div>
              <label className="block text-[13px] font-bold text-[#091F11] mb-3">Number of Bedrooms (Select all that apply)</label>
              <div className="flex flex-wrap gap-2">
                {RENT_APARTMENT_BEDROOMS.map(bed => {
                  const isSelected = (formValues.bedroomTypes || []).includes(bed)
                  return (
                    <button
                      key={bed} type="button" onClick={() => toggleBedroomType(bed)}
                      className={`px-3 py-2 rounded-xl text-[12px] font-bold border-[1.5px] transition-all flex items-center gap-1.5 ${isSelected ? 'border-[#005C3A] bg-[#F0FDF4] text-[#005C3A]' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />} {bed}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-bold text-[#091F11] mb-2">Number of Units</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                  <input type="number" {...register('totalUnits', { valueAsNumber: true })} className="w-full pl-11 pr-4 py-3.5 bg-white border-[1.5px] border-gray-200 rounded-xl text-[15px] outline-none font-bold text-[#091F11] focus:border-[#005C3A]" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#091F11] mb-2">Available Units</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                  <input type="number" {...register('availableUnits', { valueAsNumber: true })} className="w-full pl-11 pr-4 py-3.5 bg-white border-[1.5px] border-gray-200 rounded-xl text-[15px] outline-none font-bold text-[#091F11] focus:border-[#005C3A]" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2 & 3. LAND (Rent or Sell) */}
        {isLand && (
          <div className="space-y-6">
            <div>
              <label className="block text-[13px] font-bold text-[#091F11] mb-2">Size (sqm)</label>
              <div className="relative">
                <Maximize className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <input type="number" {...register('size', { valueAsNumber: true })} placeholder="e.g. 600" className="w-full pl-11 pr-4 py-3.5 bg-white border-[1.5px] border-gray-200 rounded-xl text-[15px] outline-none font-bold text-[#091F11] focus:border-[#005C3A]" />
              </div>
            </div>
          </div>
        )}

        {/* 4. SELL / HOUSE */}
        {isSellHouse && (
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Property Description (From Step 1)</label>
              <p className="text-[14px] font-medium text-[#091F11]">{formValues.title || 'No description provided.'}</p>
            </div>
          </div>
        )}

        {/* 5. SHORTLET / APARTMENT */}
        {isShortletApartment && (
          <div className="space-y-6">
            <div>
              <label className="block text-[13px] font-bold text-[#091F11] mb-2">Number of Bedrooms</label>
              <div className="relative">
                <Bed className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <select {...register('shortletBedrooms')} className="w-full pl-11 pr-4 py-3.5 bg-white border-[1.5px] border-gray-200 rounded-xl text-[15px] outline-none appearance-none font-bold text-[#091F11] focus:border-[#005C3A]">
                  <option value="">Select option</option>
                  {SHORTLET_APARTMENT_BEDROOMS.map(bed => <option key={bed} value={bed}>{bed}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* DEFAULT FALLBACK (Commercial, Other, etc.) */}
        {(!isRentApartment && !isLand && !isSellHouse && !isShortletApartment) && (
           <div className="grid grid-cols-2 gap-4">
           {[
             { name: 'bedrooms', label: 'Number of Bedrooms', icon: Bed },
             { name: 'bathrooms', label: 'Number of Bathrooms', icon: Bath },
             { name: 'toilets', label: 'Number of Toilets', icon: Home },
             { name: 'parkingSpaces', label: 'Parking Spaces', icon: Car }
           ].filter((field) => !isCommercialLease || field.name !== 'bedrooms').map((field) => (
             <div key={field.name}>
               <label className="block text-[13px] font-bold text-[#091F11] mb-2">{field.label}</label>
               <div className="relative">
                 <field.icon className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                 <select {...register(field.name as any, { valueAsNumber: true })} className="w-full pl-11 pr-4 py-3.5 bg-white border-[1.5px] border-gray-200 rounded-xl text-[15px] outline-none appearance-none font-bold text-[#091F11] focus:border-[#005C3A]">
                   {[0, 1, 2, 3, 4, 5, 6].map(num => <option key={num} value={num}>{num}</option>)}
                 </select>
                 <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
               </div>
             </div>
           ))}
         </div>
        )}

        <div className="mt-6">
          <label htmlFor="features" className="block text-[15px] font-bold text-[#091F11] mb-2">Features of Property</label>
          <p id="features-help" className="text-[12px] text-gray-500 mb-3">Describe the features in your own words, such as water supply, power, security, road access, or available facilities.</p>
          <textarea id="features" {...register('features')} rows={5} maxLength={5000} placeholder="Write the features of this property..." className="w-full px-4 py-3.5 bg-white border-[1.5px] border-gray-200 rounded-xl text-[14px] outline-none focus:border-[#005C3A] resize-y" aria-describedby="features-help" aria-invalid={Boolean(errors.features)} />
          {errors.features && <p role="alert" className="text-red-500 text-xs mt-1">{errors.features.message}</p>}
        </div>

        <div className="p-4 bg-[#F0FDF4] rounded-2xl flex items-start gap-3 mt-6">
          <div className="w-[18px] h-[18px] rounded-full bg-[#005C3A] text-white flex items-center justify-center shrink-0 mt-0.5"><Info className="w-[10px] h-[10px]" /></div>
          <p className="text-[13px] text-[#091F11] leading-relaxed">These details help potential tenants or buyers know if the property meets their needs.</p>
        </div>
      </div>
    </div>
  )
}
