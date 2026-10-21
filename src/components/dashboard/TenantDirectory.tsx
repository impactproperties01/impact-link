'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CreditCard, Plus, Search, UserRound, Users } from 'lucide-react'
import AddTenantDialog from './AddTenantDialog'
import RecordRentPayment from './RecordRentPayment'
import { getTenantStatus, isUnitAvailableForTenant, type TenantPropertyOption, type TenantUnit } from '@/lib/tenant-management'
import { formatDashboardDate } from '@/lib/dashboard-metrics'
import { formatNaira, formatUnitName } from '@/lib/property-display'

export default function TenantDirectory({ units, properties, asOf, propertyId, onManageUnits }: {
  units: TenantUnit[]; properties: TenantPropertyOption[]; asOf: string; propertyId?: string; onManageUnits?: () => void
}) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddTenant, setShowAddTenant] = useState(false)
  const [paymentUnit, setPaymentUnit] = useState<TenantUnit | null>(null)
  const now = new Date(asOf)
  const tenants = units.filter((unit) => unit.status === 'OCCUPIED')
  const availableUnits = units.filter(isUnitAvailableForTenant)
  const search = query.trim().toLowerCase()
  const filteredTenants = tenants.filter((unit) => {
    const matchesSearch = [unit.tenantName, unit.tenantPhone, formatUnitName(unit.name), unit.type, unit.property.title, unit.property.address].some((value) => value?.toLowerCase().includes(search))
    return matchesSearch && (statusFilter === 'all' || getTenantStatus(unit, now).key === statusFilter)
  })
  const formatDate = (date: string | null) => date ? formatDashboardDate(date) : 'Not recorded'
  const unitsHref = propertyId ? `/dashboard/properties/${propertyId}/manage?tab=Units` : '/dashboard/properties'

  return (
    <section className="space-y-5" aria-label={propertyId ? 'Property tenants' : 'All tenants'}>
      {showAddTenant && <AddTenantDialog units={availableUnits} properties={properties} onManageUnits={onManageUnits} onClose={() => setShowAddTenant(false)} />}
      {paymentUnit && <RecordRentPayment unit={paymentUnit} propertyId={paymentUnit.propertyId} tenancyDuration={paymentUnit.property.tenancyDuration} onClose={() => setPaymentUnit(null)} />}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-2xl font-extrabold text-brand-dark">{propertyId ? 'Property Tenants' : 'All Tenants'}</h1><p className="mt-1 text-sm text-gray-500">{propertyId ? 'Tenant details and rent periods for this property.' : 'Tenant details and rent periods across your properties.'}</p></div>
        <button onClick={() => setShowAddTenant(true)} className="inline-flex items-center gap-2 rounded-xl bg-brand-forest px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-dark"><Plus className="h-4 w-4" aria-hidden="true" />Add Tenant</button>
      </header>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-gray-200 py-3 text-sm"><p><strong className="text-brand-dark">{tenants.length}</strong> {tenants.length === 1 ? 'tenant' : 'tenants'}</p><Link href={unitsHref} onClick={(event) => { if (onManageUnits) { event.preventDefault(); onManageUnits() } }} className="font-semibold text-brand-forest hover:underline">Manage units</Link></div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-md"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" aria-hidden="true" /><span className="sr-only">Search tenants, phone numbers, properties or units</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tenant, phone, property or unit" className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-forest" /></label>
        <label className="flex items-center gap-2 text-sm text-gray-500">Rent status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-brand-dark"><option value="all">All statuses</option><option value="active">Active</option><option value="expiring">Expires soon</option><option value="expired">Expired</option><option value="scheduled">Upcoming</option><option value="missing">Dates not recorded</option></select></label>
      </div>
      {filteredTenants.length ? (
        <>
          <p className="text-xs text-gray-500 lg:hidden">Scroll across to see all tenant details.</p>
          <div className="overflow-x-auto" role="region" aria-label="Tenant details" tabIndex={0}>
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <caption className="sr-only">Tenant contact information, assigned unit, rent price, rent dates and status</caption>
              <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500"><tr>{['Tenant & phone', 'Property & assigned unit', 'Rent per term', 'Rent period', 'Status', 'Actions'].map((heading) => <th key={heading} scope="col" className="px-3 py-3 first:pl-0 last:pr-0">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-200">{filteredTenants.map((unit) => {
                const status = getTenantStatus(unit, now)
                const phone = unit.tenantPhone?.replace(/[\s()-]/g, '')
                const canCall = phone && /^\+?\d{7,15}$/.test(phone)
                return (
                  <tr key={unit.id} className="align-top">
                    <td className="max-w-52 py-5 pr-3"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-brand-forest"><UserRound className="h-5 w-5" aria-hidden="true" /></span><div className="min-w-0"><p className="break-words font-bold text-brand-dark">{unit.tenantName?.trim() || 'Tenant name not recorded'}</p>{canCall ? <a href={`tel:${phone}`} className="mt-2 inline-block text-brand-forest hover:underline">{unit.tenantPhone}</a> : <p className="mt-2 text-gray-500">{unit.tenantPhone || 'Phone not recorded'}</p>}</div></div></td>
                    <td className="max-w-72 px-3 py-5"><Link href={`/dashboard/properties/${unit.propertyId}/manage?tab=Units`} onClick={(event) => { if (onManageUnits) { event.preventDefault(); onManageUnits() } }} className="font-semibold text-brand-forest hover:underline">{unit.property.address || 'Address not recorded'}</Link><p className="mt-2 font-medium text-brand-dark">{formatUnitName(unit.name)}</p></td>
                    <td className="whitespace-nowrap px-3 py-5"><p className="font-bold text-brand-dark">{formatNaira(unit.price)}</p><p className="mt-2 text-xs text-gray-500">{unit.property.tenancyDuration ? `/ ${unit.property.tenancyDuration.toLowerCase()}` : 'Period not specified'}</p></td>
                    <td className="whitespace-nowrap px-3 py-5 text-gray-600"><p><span className="mr-2 text-xs text-gray-400">Start</span>{formatDate(unit.rentStartDate)}</p><p className="mt-2"><span className="mr-2 text-xs text-gray-400">End</span>{formatDate(unit.rentEndDate)}</p></td>
                    <td className="px-3 py-5"><span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span></td>
                    <td className="py-5 pl-3">{unit.tenantName?.trim() ? <button onClick={() => setPaymentUnit(unit)} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-emerald-200 px-3 py-2 text-xs font-bold text-brand-forest hover:bg-emerald-50"><CreditCard className="h-4 w-4" aria-hidden="true" />Record Payment</button> : <Link href={`/dashboard/properties/${unit.propertyId}/manage?tab=Units`} onClick={(event) => { if (onManageUnits) { event.preventDefault(); onManageUnits() } }} className="text-xs font-bold text-brand-forest hover:underline">Complete tenant details</Link>}</td>
                  </tr>
                )
              })}</tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500">Showing {filteredTenants.length} of {tenants.length} tenants.</p>
        </>
      ) : (
        <div className="border-y border-gray-200 py-12 text-center"><Users className="mx-auto mb-3 h-9 w-9 text-gray-300" aria-hidden="true" /><h2 className="font-bold text-brand-dark">{tenants.length ? 'No tenants match your filters' : 'No tenants added yet'}</h2><p className="mx-auto mt-2 max-w-lg text-sm text-gray-500">{tenants.length ? 'Try another search or rent status.' : availableUnits.length ? 'Add a tenant to one of your vacant assigned units.' : 'Assign an individual unit in the property’s Units tab before adding a tenant.'}</p>{tenants.length ? <button onClick={() => { setQuery(''); setStatusFilter('all') }} className="mt-4 text-sm font-bold text-brand-forest hover:underline">Clear filters</button> : <Link href={unitsHref} onClick={(event) => { if (onManageUnits) { event.preventDefault(); onManageUnits() } }} className="mt-4 inline-block text-sm font-bold text-brand-forest hover:underline">Manage assigned units</Link>}</div>
      )}
    </section>
  )
}
