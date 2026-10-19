'use client'

import { useFormContext } from 'react-hook-form'
import type { PropertyFormData } from '../schema'
import { inspectionContactSchema, type OwnerInspectionContact } from '@/lib/inspection-contact'

export default function Step5Inspection({ ownerContact }: { ownerContact: OwnerInspectionContact }) {
  const { register, watch, clearErrors, formState: { errors } } = useFormContext<PropertyFormData>()
  const contactType = watch('inspectionContactType')
  const ownerValid = inspectionContactSchema.safeParse(ownerContact).success
  const fieldClass = 'mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-brand-dark outline-none focus:border-brand-forest'
  const selectionOptions = { onChange: () => clearErrors(['inspectionContactType', 'inspectionContactName', 'inspectionContactPhone']) }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-brand-dark">Inspection details</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">Choose who our team should contact to coordinate inspections for this property. These details are shared with our team.</p>
      </div>
      <fieldset className="space-y-3">
        <legend className="mb-3 text-sm font-semibold text-brand-dark">Inspection contact</legend>
        <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${contactType === 'OWNER' ? 'border-brand-forest bg-emerald-50' : 'border-gray-200'}`}>
          <input type="radio" value="OWNER" {...register('inspectionContactType', selectionOptions)} className="mt-1 accent-brand-forest" />
          <span><span className="block text-sm font-bold text-brand-dark">Use owner <span className="font-normal text-gray-500">(default)</span></span><span className="mt-1 block text-sm text-gray-500">Use your account name and phone number.</span></span>
        </label>
        <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 ${contactType === 'CUSTOM' ? 'border-brand-forest bg-emerald-50' : 'border-gray-200'}`}>
          <input type="radio" value="CUSTOM" {...register('inspectionContactType', selectionOptions)} className="mt-1 accent-brand-forest" />
          <span><span className="block text-sm font-bold text-brand-dark">Input details</span><span className="mt-1 block text-sm text-gray-500">Enter the name and phone number of another inspection contact.</span></span>
        </label>
      </fieldset>
      {contactType === 'OWNER' ? (
        <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <div><p className="text-xs text-gray-500">Owner name</p><p className="mt-1 text-sm font-semibold text-brand-dark">{ownerContact?.name || 'Name not provided'}</p></div>
          <div><p className="text-xs text-gray-500">Phone number</p><p className="mt-1 text-sm font-semibold text-brand-dark">{ownerContact?.phone || 'Phone number not provided'}</p></div>
          {!ownerValid && <p className="text-sm text-amber-700">Your account needs a valid name and phone number. Select Input details to provide a complete inspection contact.</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-brand-dark">Name<input {...register('inspectionContactName')} autoComplete="name" maxLength={100} placeholder="Inspection contact name" className={fieldClass} aria-invalid={Boolean(errors.inspectionContactName)} />{errors.inspectionContactName && <span role="alert" className="mt-1 block text-xs text-red-600">{errors.inspectionContactName.message}</span>}</label>
          <label className="block text-sm font-semibold text-brand-dark">Phone number<input type="tel" inputMode="tel" {...register('inspectionContactPhone')} autoComplete="tel" maxLength={30} placeholder="e.g. 08012345678 or +2348012345678" className={fieldClass} aria-invalid={Boolean(errors.inspectionContactPhone)} />{errors.inspectionContactPhone && <span role="alert" className="mt-1 block text-xs text-red-600">{errors.inspectionContactPhone.message}</span>}</label>
        </div>
      )}
      {errors.inspectionContactType && <p role="alert" className="text-sm text-red-600">{errors.inspectionContactType.message}</p>}
    </div>
  )
}
