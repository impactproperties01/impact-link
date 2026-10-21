'use client'

import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { Home, Tag, Calendar, Building, MapPin, Edit3, MoreHorizontal } from 'lucide-react'
import type { PropertyFormData } from '../schema'

export default function Step1BasicInfo() {
  const { register, setValue, watch, getValues, formState: { errors } } = useFormContext<PropertyFormData>()
  const formValues = watch()
  const hasDescription = formValues.listingType === 'SALE' || formValues.listingType === 'LEASE'
  const ownerFieldClass = 'w-full px-4 py-3.5 bg-white border-[1.5px] border-gray-200 rounded-xl text-[15px] outline-none focus:border-[#005C3A]'

  // 1. Determine which Property Types to show based on Listing Type
  let availablePropertyTypes: string[] = []
  if (formValues.listingType === 'RENTAL') availablePropertyTypes = ['APARTMENT', 'LAND']
  else if (formValues.listingType === 'SALE') availablePropertyTypes = ['HOUSE', 'LAND']
  else if (formValues.listingType === 'SHORTLET') availablePropertyTypes = ['APARTMENT']
  else if (formValues.listingType === 'LEASE') availablePropertyTypes = ['HOUSE', 'COMMERCIAL', 'LAND']

  // 2. Handle Listing Type clicks (Auto-corrects Property Type & Title)
  const handleListingTypeChange = (type: PropertyFormData['listingType']) => {
    if (type === formValues.listingType) return
    setValue('listingType', type)
    
    // Determine the allowed properties for the NEW type
    let allowed: string[] = []
    if (type === 'RENTAL') allowed = ['APARTMENT', 'LAND']
    else if (type === 'SALE') allowed = ['HOUSE', 'LAND']
    else if (type === 'SHORTLET') allowed = ['APARTMENT']
    else if (type === 'LEASE') allowed = ['HOUSE', 'COMMERCIAL', 'LAND']

    // If current property type is not allowed in the new category, reset it to the first available
    const currentPropType = getValues('propertyType')
    if (!allowed.includes(currentPropType)) {
      setValue('propertyType', allowed[0] as any)
    }

    if (type === 'LEASE') setValue('tenancyDuration', '1 year')

    if (type !== 'SALE' && type !== 'LEASE') {
      setValue('title', `Standard ${type} Listing`)
    } else if (!hasDescription) {
      setValue('title', '')
    }
  }

  // Ensure title has a dummy value on initial mount if starting on RENTAL
  useEffect(() => {
    if (!hasDescription && (!formValues.title || formValues.title.length < 5)) {
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
      {!hasDescription && <input type="hidden" {...register('title')} />}

      <div>
        <label className="block text-[15px] font-bold text-[#091F11] mb-4">What do you want to do with this property?</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'RENTAL', icon: Home, label: 'Rent', sub: 'Rent out your property' },
            { id: 'SALE', icon: Tag, label: 'Sell', sub: 'Sell your property' },
            { id: 'SHORTLET', icon: Calendar, label: 'Shortlet', sub: 'List for short stays' },
            { id: 'LEASE', icon: Building, label: 'Lease', sub: 'Lease your property' }
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
            const Icon = type === 'APARTMENT' || type === 'COMMERCIAL' ? Building : type === 'LAND' ? MapPin : Home;
            const label = formValues.listingType === 'LEASE'
              ? ({ HOUSE: 'Residential homes', COMMERCIAL: 'Commercial buildings', LAND: 'Land' }[type] || type.toLowerCase())
              : type.toLowerCase()
            return (
            <button
              key={type} type="button" onClick={() => setValue('propertyType', type as any)}
              className={`flex flex-col items-center py-4 px-2 rounded-2xl border-[1.5px] transition-all ${
                formValues.propertyType === type ? 'border-[#005C3A] bg-[#F0FDF4]' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <Icon className={`w-6 h-6 mb-2 ${formValues.propertyType === type ? 'text-[#005C3A]' : 'text-gray-500'}`} />
              <span className={`font-bold text-[11px] capitalize ${formValues.propertyType === type ? 'text-[#005C3A]' : 'text-[#091F11]'}`}>{label}</span>
            </button>
          )})}
        </div>
      </div>

      <div className="space-y-6">

        <fieldset className="space-y-5">
          <legend className="text-[15px] font-bold text-[#091F11] mb-4">Relationship to property</legend>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'DIRECT_OWNER', label: 'Direct owner' },
              { value: 'OTHER', label: 'Other' },
            ].map(({ value, label }) => (
              <label key={value} className={`flex items-center gap-2.5 p-4 rounded-2xl border-[1.5px] cursor-pointer text-[13px] font-bold ${formValues.propertyRelationship === value ? 'border-[#005C3A] bg-[#F0FDF4] text-[#005C3A]' : 'border-gray-200 text-[#091F11]'}`}>
                <input type="radio" value={value} {...register('propertyRelationship', {
                  onChange: () => {
                    if (formValues.propertyRelationship !== value) {
                      setValue('ownerRelationship', '')
                      setValue('directOwnerName', '')
                      setValue('directOwnerPhone', '')
                      setValue('directOwnerAddress', '')
                    }
                  },
                })} className="accent-[#005C3A]" />
                {label}
              </label>
            ))}
          </div>
          {errors.propertyRelationship && <p role="alert" className="text-red-500 text-xs">Select your relationship to the property.</p>}
          {formValues.propertyRelationship === 'OTHER' && (
            <div>
              <label htmlFor="ownerRelationship" className="block text-[13px] font-bold text-[#091F11] mb-2">Relationship with the direct owner</label>
              <input id="ownerRelationship" {...register('ownerRelationship')} maxLength={200} placeholder="e.g. Agent, family member, or property manager" className={ownerFieldClass} aria-invalid={Boolean(errors.ownerRelationship)} />
              {errors.ownerRelationship && <p role="alert" className="text-red-500 text-xs mt-1">{errors.ownerRelationship.message}</p>}
            </div>
          )}
          <div className="space-y-4">
            <h3 className="text-[14px] font-bold text-[#091F11]">Direct owner details</h3>
            <p className="text-[12px] text-gray-500">{formValues.propertyRelationship === 'OTHER' ? 'Provide the details of the person who owns this property.' : 'Confirm your name, phone number, and contact address as the direct owner.'}</p>
            <div>
              <label htmlFor="directOwnerName" className="block text-[13px] font-bold text-[#091F11] mb-2">Full name</label>
              <input id="directOwnerName" {...register('directOwnerName')} autoComplete="off" maxLength={100} placeholder="Direct owner’s full name" className={ownerFieldClass} aria-invalid={Boolean(errors.directOwnerName)} />
              {errors.directOwnerName && <p role="alert" className="text-red-500 text-xs mt-1">{errors.directOwnerName.message}</p>}
            </div>
            <div>
              <label htmlFor="directOwnerPhone" className="block text-[13px] font-bold text-[#091F11] mb-2">Phone number</label>
              <input id="directOwnerPhone" type="tel" inputMode="tel" {...register('directOwnerPhone')} autoComplete="off" maxLength={30} placeholder="e.g. 08012345678 or +2348012345678" className={ownerFieldClass} aria-invalid={Boolean(errors.directOwnerPhone)} />
              {errors.directOwnerPhone && <p role="alert" className="text-red-500 text-xs mt-1">{errors.directOwnerPhone.message}</p>}
            </div>
            <div>
              <label htmlFor="directOwnerAddress" className="block text-[13px] font-bold text-[#091F11] mb-2">Contact address</label>
              <textarea id="directOwnerAddress" {...register('directOwnerAddress')} autoComplete="off" rows={3} maxLength={500} placeholder="Direct owner’s contact address" className={`${ownerFieldClass} resize-y`} aria-invalid={Boolean(errors.directOwnerAddress)} />
              {errors.directOwnerAddress && <p role="alert" className="text-red-500 text-xs mt-1">{errors.directOwnerAddress.message}</p>}
            </div>
          </div>
        </fieldset>
        
        {/* Sale and lease descriptions use the existing title field. */}
        {hasDescription && (
          <div>
            <label className="block text-[15px] font-bold text-[#091F11] mb-2">Description</label>
            <div className="relative">
              <Edit3 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input {...register('title')} placeholder={`Enter a brief description for this ${formValues.listingType === 'LEASE' ? 'lease' : 'sale'}...`} className="w-full pl-12 pr-4 py-3.5 bg-white border-[1.5px] border-gray-200 rounded-xl text-[15px] outline-none focus:border-[#005C3A]" />
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
