'use client'

import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { X } from 'lucide-react'
import { addTenantAction } from '@/actions/tenants'
import { addTenantSchema, isUnitAvailableForTenant, type TenantPropertyOption, type TenantUnit } from '@/lib/tenant-management'
import { extendRentDate, getRentExtensionMonths } from '@/lib/rent-payments'
import { formatNaira, formatUnitName } from '@/lib/property-display'

export default function AddTenantDialog({ units, properties, onClose, onManageUnits }: {
  units: TenantUnit[]; properties: TenantPropertyOption[]; onClose: () => void; onManageUnits?: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const submitting = useRef(false)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [propertyId, setPropertyId] = useState(properties.length === 1 ? properties[0].id : '')
  const [unitId, setUnitId] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [tenantPhone, setTenantPhone] = useState('')
  const [startDate, setStartDate] = useState(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()))
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState('')
  const availableUnits = units.filter((unit) => unit.propertyId === propertyId && isUnitAvailableForTenant(unit))
  const selectedUnit = availableUnits.find((unit) => unit.id === unitId)

  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])

  const suggestEndDate = (start: string, unit: TenantUnit | undefined) => {
    if (start && unit) {
      const date = new Date(`${start}T00:00:00Z`)
      if (Number.isFinite(date.getTime())) setEndDate(extendRentDate(date, getRentExtensionMonths(unit.property.tenancyDuration)).toISOString().slice(0, 10))
    }
  }

  const saveTenant = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current) return
    const parsed = addTenantSchema.safeParse({ unitId, propertyId, tenantName, tenantPhone, rentStartDate: startDate, rentEndDate: endDate })
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || 'Check the tenant details.'); return }
    if (!selectedUnit) { setError('Select an available assigned unit.'); return }
    submitting.current = true
    setError('')
    startTransition(async () => {
      try {
        const result = await addTenantAction(parsed.data)
        if (result.success) { router.refresh(); onClose() }
        else setError(result.error || 'Could not save the tenant.')
      } catch {
        setError('Could not confirm the tenant was saved. Refresh to check the unit before trying again.')
      } finally { submitting.current = false }
    })
  }

  const fieldClass = 'mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal text-brand-dark outline-none focus:border-brand-forest disabled:bg-gray-50'
  return (
    <dialog ref={dialog} aria-labelledby="add-tenant-title" onCancel={(event) => { event.preventDefault(); if (!isPending) onClose() }} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl bg-white p-5 text-brand-dark shadow-xl backdrop:bg-black/50 sm:p-6">
      <form onSubmit={saveTenant} className="space-y-4">
        <div className="flex items-center justify-between gap-3"><h2 id="add-tenant-title" className="text-xl font-extrabold">Add Tenant</h2><button type="button" onClick={onClose} disabled={isPending} aria-label="Close add tenant form" className="rounded-full p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button></div>
        <p className="text-sm text-gray-500">Choose a vacant unit already assigned in the property’s Units tab.</p>
        <label className="block text-sm font-semibold">Property<select required value={propertyId} disabled={isPending} onChange={(event) => { setPropertyId(event.target.value); setUnitId(''); setEndDate(''); setError('') }} className={fieldClass}><option value="">Select a property</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}</select></label>
        <label className="block text-sm font-semibold">Assigned unit<select required value={unitId} disabled={isPending || !availableUnits.length} onChange={(event) => { setUnitId(event.target.value); suggestEndDate(startDate, availableUnits.find((unit) => unit.id === event.target.value)) }} className={fieldClass}><option value="">Select a vacant unit</option>{availableUnits.map((unit) => <option key={unit.id} value={unit.id}>{formatUnitName(unit.name)} — {unit.type}</option>)}</select></label>
        {propertyId && !availableUnits.length && <p role="status" className="text-sm text-amber-700">No vacant assigned units are available for this property. <Link href={`/dashboard/properties/${propertyId}/manage?tab=Units`} onClick={(event) => { if (onManageUnits) { event.preventDefault(); onClose(); onManageUnits() } }} className="font-bold underline">Open the Units tab</Link> to assign a unit first.</p>}
        {!properties.length && <p className="text-sm text-gray-500">Add a property and assign its units first. <Link href="/properties/new" className="font-bold text-brand-forest underline">Add a property</Link></p>}
        {selectedUnit && <p className="text-sm text-gray-600">Unit rent: <strong>{formatNaira(selectedUnit.price)}</strong>{selectedUnit.property.tenancyDuration ? ` / ${selectedUnit.property.tenancyDuration.toLowerCase()}` : ''}</p>}
        <fieldset disabled={isPending || !selectedUnit} className="space-y-4 disabled:opacity-60">
          <label className="block text-sm font-semibold">Tenant’s full name<input required autoComplete="name" maxLength={120} value={tenantName} onChange={(event) => setTenantName(event.target.value)} className={fieldClass} /></label>
          <label className="block text-sm font-semibold">Phone number<input required type="tel" autoComplete="tel" maxLength={30} placeholder="e.g. 08012345678" value={tenantPhone} onChange={(event) => setTenantPhone(event.target.value)} className={fieldClass} /></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Rent start date<input required type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); suggestEndDate(event.target.value, selectedUnit) }} className={fieldClass} /></label><label className="block text-sm font-semibold">Rent end date<input required type="date" min={startDate || undefined} value={endDate} onChange={(event) => setEndDate(event.target.value)} className={fieldClass} /></label></div>
        </fieldset>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={isPending || !selectedUnit} className="w-full rounded-xl bg-brand-forest px-4 py-3 text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-50">{isPending ? 'Adding tenant...' : 'Add Tenant'}</button>
      </form>
    </dialog>
  )
}
