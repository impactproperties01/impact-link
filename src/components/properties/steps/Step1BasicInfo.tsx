'use client'

import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { Home, Tag, Calendar, Building, MapPin, Edit3, MoreHorizontal } from 'lucide-react'
import type { PropertyFormData } from '../schema'

export default function Step1BasicInfo() {
  const { register, setValue, watch, getValues, formState: { errors } } = useFormContext<PropertyFormData>()
  const formValues = watch()

  // 1. Determine which Property Types to show based on Listing Type
  let availablePropertyTypes: string[] = []
  if (formValues.listingType === 'RENTAL') availablePropertyTypes = ['APARTMENT', 'LAND']
  else if (formValues.listingType === 'SALE') availablePropertyTypes = ['HOUSE', 'LAND']
  else if (formValues.listingType === 'SHORTLET') availablePropertyTypes = ['APARTMENT']

  // 2. Handle Listing Type clicks (Auto-corrects Property Type & Title)
  const handleListingTypeChange = (type: 'RENTAL' | 'SALE' | 'SHORTLET') => {
    setValue('listingType', type)
    
    // Determine the allowed properties for the NEW type
    let allowed: string[] = []
    if (type === 'RENTAL') allowed = ['APARTMENT', 'LAND']
    else if (type === 'SALE') allowed = ['HOUSE', 'LAND']
    else if (type === 'SHORTLET') allowed = ['APARTMENT']

    // If current property type is not allowed in the new category, reset it to the first available
    const currentPropType = getValues('propertyType')
    if (!allowed.includes(currentPropType)) {
      setValue('propertyType', allowed[0] as any)
    }

    // Handle Title requirement: Zod requires min 5 chars.
    // If not SALE, we hide it and auto-fill it to pass validation.
    if (type !== 'SALE') {
      setValue('title', `Standard ${type} Listing`)
    } else {
      setValue('title', '') // Clear it so they can type their description
    }
  }

  // Ensure title has a dummy value on initial mount if starting on RENTAL
  useEffect(() => {
    if (formValues.listingType !== 'SALE' && (!formValues.title || formValues.title.length < 5)) {
      setValue('title', `Standard ${formValues.listingType} Listing`)
    }
    
    // Ensure hidden state/area fields have values to pass validation
    if (!formValues.state) setValue('state', 'Lagos')
    if (!formValues.locationArea) setValue('locationArea', 'Lekki')
  }, [])

  return (
    <div className="space-y-8 mt-2">
      {/* Hidden inputs to pass Zod schema validation silently */}
      <input type="hidden" {...register('state')} />
      <input type="hidden" {...register('locationArea')} />
      {formValues.listingType !== 'SALE' && <input type="hidden" {...register('title')} />}

      <div>
        <label className="block text-[15px] font-bold text-[#091F11] mb-4">What do you want to do with this property?</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'RENTAL', icon: Home, label: 'Rent', sub: 'Rent out your property' },
            { id: 'SALE', icon: Tag, label: 'Sell', sub: 'Sell your property' },
            { id: 'SHORTLET', icon: Calendar, label: 'Shortlet', sub: 'List for short stays' }
          ].map((type) => (
            <button
              key={type.id} type="button" 
              onClick={() => handleListingTypeChange(type.id as any)}
              className={`flex flex-col items-center p-4 rounded-2xl border-[1.5px] transition-all text-center ${
                formValues.listingType === type.id ? 'border-[#005C3A] bg-[#F0FDF4]' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <type.icon className={`w-7 h-7 mb-3 ${formValues.listingType === type.id ? 'text-[#005C3A]' : 'text-gray-600'}`} />
              <span className={`font-bold text-[13px] ${formValues.listingType === type.id ? 'text-[#005C3A]' : 'text-[#091F11]'}`}>{type.label}</span>
              <span className="text-[10px] mt-1 text-gray-500 leading-tight hidden md:block">{type.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[15px] font-bold text-[#091F11] mb-4">Property Type</label>
        <div className="grid grid-cols-3 gap-3">
          {availablePropertyTypes.map((type) => {
            const Icon = type === 'APARTMENT' ? Building : type === 'LAND' ? MapPin : Home;
            return (
            <button
              key={type} type="button" onClick={() => setValue('propertyType', type as any)}
              className={`flex flex-col items-center py-4 px-2 rounded-2xl border-[1.5px] transition-all ${
                formValues.propertyType === type ? 'border-[#005C3A] bg-[#F0FDF4]' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <Icon className={`w-6 h-6 mb-2 ${formValues.propertyType === type ? 'text-[#005C3A]' : 'text-gray-500'}`} />
              <span className={`font-bold text-[11px] capitalize ${formValues.propertyType === type ? 'text-[#005C3A]' : 'text-[#091F11]'}`}>{type.toLowerCase()}</span>
            </button>
          )})}
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Only show this field if SALE is selected. We map it to 'title' to satisfy the DB schema */}
        {formValues.listingType === 'SALE' && (
          <div>
            <label className="block text-[15px] font-bold text-[#091F11] mb-2">Description</label>
            <div className="relative">
              <Edit3 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input {...register('title')} placeholder="Enter a brief description for this sale..." className="w-full pl-12 pr-4 py-3.5 bg-white border-[1.5px] border-gray-200 rounded-xl text-[15px] outline-none focus:border-[#005C3A]" />
            </div>
            <p className="text-[12px] text-gray-500 mt-2">Provide a short, catchy description of the property.</p>
            {errors.title && <span className="text-red-500 text-xs mt-1">{errors.title.message}</span>}
          </div>
        )}

        <div>
          <label className="block text-[15px] font-bold text-[#091F11] mb-4">Property Location</label>
          <div className="space-y-5">
            <div>
              <label className="block text-[13px] font-bold text-[#091F11] mb-2">Full Address</label>
              <div className="relative">
                 <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                 <input {...register('address')} placeholder="Freedom Way, Lekki Phase 1, Lagos" className="w-full pl-12 pr-4 py-3.5 bg-white border-[1.5px] border-gray-200 rounded-xl text-[15px] outline-none focus:border-[#005C3A]" />
              </div>
              <p className="text-[12px] text-gray-500 mt-2">Enter the exact address of the property.</p>
              {errors.address && <span className="text-red-500 text-xs mt-1">{errors.address.message}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}