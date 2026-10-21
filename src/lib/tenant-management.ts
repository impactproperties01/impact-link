import type { Property, Unit } from '@prisma/client'
import { z } from 'zod'
import { getDashboardDates } from '@/lib/dashboard-metrics'
import { getListingTitle } from '@/lib/property-display'

export type TenantProperty = Pick<Property, 'id' | 'address' | 'listingType' | 'propertyType' | 'bedroomTypes' | 'shortletBedrooms' | 'tenancyDuration'>
export type TenantSourceUnit = Pick<Unit, 'id' | 'propertyId' | 'name' | 'type' | 'price' | 'status' | 'tenantId' | 'tenantName' | 'tenantPhone' | 'rentStartDate' | 'rentEndDate'>
export type TenantPropertyOption = { id: string; title: string; address: string }
export type TenantUnit = Omit<TenantSourceUnit, 'rentStartDate' | 'rentEndDate'> & {
  rentStartDate: string | null
  rentEndDate: string | null
  property: TenantPropertyOption & { tenancyDuration: string | null }
}

export function serializeTenantUnit(unit: TenantSourceUnit, property: TenantProperty): TenantUnit {
  return {
    id: unit.id, propertyId: unit.propertyId, name: unit.name, type: unit.type, price: unit.price, status: unit.status,
    tenantId: unit.tenantId, tenantName: unit.tenantName, tenantPhone: unit.tenantPhone,
    rentStartDate: unit.rentStartDate?.toISOString() ?? null, rentEndDate: unit.rentEndDate?.toISOString() ?? null,
    property: { id: property.id, title: getListingTitle(property), address: property.address, tenancyDuration: property.tenancyDuration },
  }
}

export function isUnitAvailableForTenant(unit: Pick<TenantUnit, 'status' | 'tenantId' | 'tenantName'>) {
  return unit.status === 'VACANT' && !unit.tenantId && (unit.tenantName === null || unit.tenantName === '')
}

function isCalendarDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid date.').refine(isCalendarDate, 'Choose a valid date.')
export const addTenantSchema = z.object({
  unitId: z.string().trim().min(1, 'Select an assigned unit.'),
  propertyId: z.string().trim().min(1, 'Select a property.'),
  tenantName: z.string().trim().min(2, 'Enter the tenant’s full name.').max(120, 'Name must be 120 characters or fewer.'),
  tenantPhone: z.string().trim().max(30).refine((value) => /^\+?\d{7,15}$/.test(value.replace(/[\s()-]/g, '')), 'Enter a valid tenant phone number.'),
  rentStartDate: calendarDate,
  rentEndDate: calendarDate,
}).refine((data) => data.rentEndDate > data.rentStartDate, { path: ['rentEndDate'], message: 'Rent end date must be after the start date.' })

export type AddTenantInput = z.infer<typeof addTenantSchema>

export function getTenantStatus(unit: Pick<TenantUnit, 'rentStartDate' | 'rentEndDate'>, now: Date) {
  const dates = getDashboardDates(now)
  const end = unit.rentEndDate ? new Date(unit.rentEndDate) : null
  const start = unit.rentStartDate ? new Date(unit.rentStartDate) : null
  if (!end || !Number.isFinite(end.getTime())) return { key: 'missing', label: 'Dates not recorded', className: 'bg-gray-100 text-gray-600' }
  if (end < dates.today) return { key: 'expired', label: 'Expired', className: 'bg-red-50 text-red-700' }
  if (start && start >= dates.tomorrow) return { key: 'scheduled', label: 'Upcoming', className: 'bg-blue-50 text-blue-700' }
  if (end < dates.upcomingEnd) return { key: 'expiring', label: 'Expires soon', className: 'bg-amber-50 text-amber-700' }
  return { key: 'active', label: 'Active', className: 'bg-emerald-50 text-brand-forest' }
}
