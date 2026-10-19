'use client'

import { useFormContext } from 'react-hook-form'
import { Check, CheckCircle2, FileText, Info } from 'lucide-react'

const STANDARD_DOCUMENTS = [
  'Certificate of Occupancy (C of O)', 
  'Deed of Assignment', 
  'Governor\'s Consent', 
  'Survey Plan', 
  'Excision', 
  'Gazette', 
  'Power of Attorney',
  'Contract of Sale',
  'Receipt'
]

export default function Step5Documents() {
  const { setValue, getValues, watch } = useFormContext<any>()
  const formValues = watch()

  const toggleDocument = (doc: string) => {
    const current = getValues('documents') || []
    const updated = current.includes(doc) ? current.filter((d: string) => d !== doc) : [...current, doc]
    setValue('documents', updated)
  }

  return (
    <div className="space-y-6 mt-2">
      <div className="mb-2">
        <label className="block text-[15px] font-bold text-[#091F11] mb-2">Available Documents</label>
        <p className="text-[13px] text-gray-500 mb-6">Select all the legal documents available for this property to build trust with buyers.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {STANDARD_DOCUMENTS.map(doc => {
            const isSelected = (formValues.documents || []).includes(doc)
            return (
              <button 
                key={doc} type="button" onClick={() => toggleDocument(doc)} 
                className={`px-4 py-3.5 rounded-xl text-[13px] font-bold border-[1.5px] transition-all flex items-center gap-3 text-left ${isSelected ? 'border-[#005C3A] bg-[#F0FDF4] text-[#005C3A]' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${isSelected ? 'bg-[#005C3A] border-[#005C3A]' : 'border-gray-300'}`}>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                {doc}
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-4 bg-[#F0FDF4] rounded-2xl flex items-start gap-3 mt-6">
        <div className="w-[18px] h-[18px] rounded-full bg-[#005C3A] text-white flex items-center justify-center shrink-0 mt-0.5"><Info className="w-[10px] h-[10px]" /></div>
        <p className="text-[13px] text-[#091F11] leading-relaxed">Having verified documents like a C of O or Governor's Consent significantly increases your chances of closing a sale quickly.</p>
      </div>
    </div>
  )
}