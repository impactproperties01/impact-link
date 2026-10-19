'use client'

import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { Wallet, Calendar, ShieldCheck, Link as LinkIcon, Info } from 'lucide-react'
import Link from 'next/link'

export default function Step3Pricing() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<any>()
  const formValues = watch()

  // Determine active conditions based on Step 1 & 2
  const isRent = formValues.listingType === 'RENTAL'
  const isSale = formValues.listingType === 'SALE'
  const isShortlet = formValues.listingType === 'SHORTLET'
  const isApartment = formValues.propertyType === 'APARTMENT'
  
  const activeBedroomTypes = formValues.bedroomTypes || []
  const isMultiUnitRent = isRent && isApartment && activeBedroomTypes.length > 0

  // Live calculations for standard single-price mode
  const basePrice = Number(formValues.basePrice) || 0
  const cautionFee = Number(formValues.cautionFee) || 0

  // Standard Fees
  const agreementFee = basePrice * 0.20
  const platformFee = basePrice * 0.20
  const totalPackage = basePrice + cautionFee + agreementFee + platformFee

  // Auto-sync lowest unit price to basePrice so the Database doesn't crash
  const unitPrices = formValues.unitPrices || {}
  
  useEffect(() => {
    if (isMultiUnitRent && unitPrices) {
      const prices = Object.values(unitPrices).map(v => Number(v)).filter(p => p > 0 && !isNaN(p))
      if (prices.length > 0) {
        setValue('basePrice', Math.min(...prices))
      }
    }
  }, [JSON.stringify(unitPrices), isMultiUnitRent, setValue])

  return (
    <div className="space-y-6 mt-2">
      
      {/* 1A. MULTI-UNIT RENT (Apartments with specific bedroom types) */}
      {isMultiUnitRent && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-bold text-[#091F11] mb-2">Tenancy</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <select {...register('tenancyDuration')} className="w-full pl-11 pr-4 py-3.5 bg-white border-[1.5px] border-gray-200 rounded-xl text-[14px] outline-none font-bold text-[#091F11] focus:border-[#005C3A] appearance-none">
                  <option value="1 year">1 Year</option>
                  <option value="6 months">6 Months</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#091F11] mb-2 flex items-center justify-between">
                Caution Fee
                <span className="text-[10px] text-gray-400 font-normal">If applicable</span>
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <input type="number" {...register('cautionFee', { valueAsNumber: true })} placeholder="0" className="w-full pl-11 pr-4 py-3.5 bg-white border-[1.5px] border-gray-200 rounded-xl text-[14px] outline-none font-bold text-[#091F11] focus:border-[#005C3A]" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[14px] font-extrabold text-[#091F11] border-b border-gray-100 pb-2">Set Unit Prices</h4>
            
            {activeBedroomTypes.map((type: string) => {
              const uPrice = Number(unitPrices[type]) || 0
              const uAgreement = uPrice * 0.20
              const uPlatform = uPrice * 0.20
              const uTotal = uPrice + cautionFee + uAgreement + uPlatform

              return (
                <div key={type} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                  <label className="block text-[13px] font-bold text-[#091F11] capitalize">{type} Rent (₦)</label>
                  <div className="relative">
                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                    <input type="number" {...register(`unitPrices.${type}`, { valueAsNumber: true })} placeholder="e.g. 500000" className="w-full pl-11 pr-4 py-3.5 bg-white border-[1.5px] border-gray-300 rounded-xl text-[14px] outline-none font-bold text-[#091F11] focus:border-[#005C3A]" />
                  </div>
                  
                  {uPrice > 0 && (
                    <div className="mt-3 space-y-2 text-[12px] pt-3 border-t border-gray-200">
                      <div className="flex justify-between text-gray-500">
                        <span>Agreement (20%)</span>
                        <span className="font-bold text-[#091F11]">₦{uAgreement.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Platform (20%)</span>
                        <span className="font-bold text-[#091F11]">₦{uPlatform.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 mt-2">
                        <span className="font-extrabold text-[#091F11] text-[13px]">Total Package</span>
                        <span className="font-extrabold text-[#005C3A] text-[15px]">₦{uTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 1B. STANDARD RENT (Land or Properties without specific sub-types) */}
      {isRent && !isMultiUnitRent && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-bold text-[#091F11] mb-2">Tenancy</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <select {...register('tenancyDuration')} className="w-full pl-11 pr-4 py-3.5 bg-white border-[1.5px] border-gray-200 rounded-xl text-[14px] outline-none font-bold text-[#091F11] focus:border-[#005C3A] appearance-none">
                  <option value="1 year">1 Year</option>
                  <option value="6 months">6 Months</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#091F11] mb-2">Price (₦)</label>
              <div className="relative">
                <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                <input type="number" {...register('basePrice', { valueAsNumber: true })} placeholder="0" className="w-full pl-11 pr-4 py-3.5 bg-white border-[1.5px] border-gray-200 rounded-xl text-[14px] outline-none font-bold text-[#091F11] focus:border-[#005C3A]" />
              </div>
              {errors.basePrice && <span className="text-red-500 text-xs mt-1">{errors.basePrice?.message as string}</span>}
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#091F11] mb-2 flex items-center justify-between">
              Caution Fee (₦)
              <span className="text-[10px] text-gray-400 font-normal">If applicable</span>
            </label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
              <input type="number" {...register('cautionFee', { valueAsNumber: true })} placeholder="0" className="w-full pl-11 pr-4 py-3.5 bg-white border-[1.5px] border-gray-200 rounded-xl text-[14px] outline-none font-bold text-[#091F11] focus:border-[#005C3A]" />
            </div>
          </div>

          {/* Breakdown Card */}
          <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl space-y-4">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Cost Breakdown</h4>
            
            <div className="flex justify-between items-center text-[14px]">
              <span className="text-gray-500">Rent</span>
              <span className="font-bold text-[#091F11]">₦{basePrice.toLocaleString()}</span>
            </div>
            
            {cautionFee > 0 && (
              <div className="flex justify-between items-center text-[14px]">
                <span className="text-gray-500">Caution Fee</span>
                <span className="font-bold text-[#091F11]">₦{cautionFee.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between items-start text-[14px]">
              <div className="flex flex-col">
                <span className="text-gray-500">Agreement Fee (20%)</span>
                <Link href="/lawyers" className="text-[#005C3A] text-[11px] font-bold flex items-center gap-1 mt-1 hover:underline">
                  <LinkIcon className="w-3 h-3" /> Contact available lawyers
                </Link>
              </div>
              <span className="font-bold text-[#091F11]">₦{agreementFee.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center text-[14px]">
              <span className="text-gray-500 flex items-center gap-1">Platform Fee (20%) <Info className="w-3.5 h-3.5 text-gray-400"/></span>
              <span className="font-bold text-[#091F11]">₦{platformFee.toLocaleString()}</span>
            </div>

            <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
              <span className="font-extrabold text-[#091F11] text-[15px]">Total Package</span>
              <span className="font-extrabold text-[#005C3A] text-[18px]">₦{totalPackage.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. SALE */}
      {isSale && (
        <div className="space-y-6">
          <div>
            <label className="block text-[13px] font-bold text-[#091F11] mb-2">Outright Price (₦)</label>
            <div className="relative">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
              <input type="number" {...register('basePrice', { valueAsNumber: true })} placeholder="e.g. 50000000" className="w-full pl-11 pr-4 py-4 bg-white border-[1.5px] border-gray-200 rounded-xl text-[16px] outline-none font-bold text-[#091F11] focus:border-[#005C3A]" />
            </div>
            {errors.basePrice && <span className="text-red-500 text-xs mt-1">{errors.basePrice?.message as string}</span>}
          </div>
          
          <div>
            <label className="block text-[13px] font-bold text-[#091F11] mb-2 flex items-center justify-between">
              Installmental Price (₦)
              <span className="text-[10px] text-gray-400 font-normal">Optional</span>
            </label>
            <div className="relative">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
              <input type="number" {...register('installmentalPrice', { valueAsNumber: true })} placeholder="e.g. 55000000" className="w-full pl-11 pr-4 py-4 bg-white border-[1.5px] border-gray-200 rounded-xl text-[16px] outline-none font-bold text-[#091F11] focus:border-[#005C3A]" />
            </div>
            <p className="text-[11px] text-gray-500 mt-2">Provide the total price if the buyer opts for a payment plan.</p>
          </div>
        </div>
      )}

      {/* 3. SHORTLET */}
      {isShortlet && (
        <div className="space-y-6">
          <div>
            <label className="block text-[13px] font-bold text-[#091F11] mb-2">Price Per Night (₦)</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
              <input type="number" {...register('basePrice', { valueAsNumber: true })} placeholder="e.g. 80000" className="w-full pl-11 pr-4 py-4 bg-white border-[1.5px] border-gray-200 rounded-xl text-[16px] outline-none font-bold text-[#091F11] focus:border-[#005C3A]" />
            </div>
            {errors.basePrice && <span className="text-red-500 text-xs mt-1">{errors.basePrice?.message as string}</span>}
          </div>

          <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl space-y-4">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Fee Breakdown</h4>
            <div className="flex justify-between items-center text-[14px]">
              <span className="text-gray-500">Price per night</span>
              <span className="font-bold text-[#091F11]">₦{basePrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-[14px]">
              <span className="text-gray-500 flex items-center gap-1">Platform Fee (20%) <Info className="w-3.5 h-3.5 text-gray-400"/></span>
              <span className="font-bold text-[#091F11]">₦{platformFee.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}