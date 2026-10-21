import type { Property, Unit } from '@prisma/client'

export type DashboardProperty = Pick<Property,
  'id' | 'listingType' | 'propertyType' | 'address' | 'basePrice' | 'bedrooms' | 'bathrooms' |
  'bedroomTypes' | 'shortletBedrooms' | 'size' | 'images' | 'status' | 'tenancyDuration' |
  'unitPrices' | 'totalUnits' | 'availableUnits'
> & { units: Pick<Unit, 'status'>[] }

export type DashboardPaymentRecord = {
  id: string
  amount: number
  status: 'Paid' | 'Overdue' | 'Due today' | 'Pending'
  dueDate: string
  datePaid: string | null
  tenantName: string
  unitName?: string | null
  propertyId: string
  propertyAddress: string
  receiptUrl: string | null
}

type OccupancyProperty = Pick<Property, 'listingType' | 'propertyType' | 'totalUnits' | 'availableUnits'> & {
  units: Pick<Unit, 'status'>[]
}

export function getPropertyOccupancy(property: OccupancyProperty) {
  const declaredTotal = property.listingType === 'RENTAL' && property.propertyType === 'APARTMENT'
    ? Math.max(0, property.totalUnits ?? 0) : 0
  if (property.units.length) {
    const total = Math.max(declaredTotal, property.units.length)
    const occupied = property.units.filter((unit) => unit.status === 'OCCUPIED').length
    const vacant = property.units.filter((unit) => unit.status === 'VACANT').length
    return { total, occupied, vacant, unknown: total - occupied - vacant }
  }
  if (property.availableUnits !== null && declaredTotal > 0) {
    const vacant = Math.min(declaredTotal, Math.max(0, property.availableUnits))
    return { total: declaredTotal, occupied: declaredTotal - vacant, vacant, unknown: 0 }
  }
  return { total: declaredTotal, occupied: 0, vacant: 0, unknown: declaredTotal }
}

export function getPortfolioOccupancy(properties: OccupancyProperty[]) {
  return properties.reduce((totals, property) => {
    const counts = getPropertyOccupancy(property)
    return { total: totals.total + counts.total, occupied: totals.occupied + counts.occupied, vacant: totals.vacant + counts.vacant, unknown: totals.unknown + counts.unknown }
  }, { total: 0, occupied: 0, vacant: 0, unknown: 0 })
}

export function getDashboardDates(now: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', hourCycle: 'h23',
  }).formatToParts(now)
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value)
  const year = value('year')
  const today = new Date(Date.UTC(year, value('month') - 1, value('day')) - 3600000)
  const tomorrow = new Date(today.getTime() + 86400000)
  const upcomingEnd = new Date(today.getTime() + 31 * 86400000)
  const yearStart = new Date(Date.UTC(year, 0, 1) - 3600000)
  const hour = value('hour')
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  return { today, tomorrow, upcomingEnd, yearStart, year, greeting }
}

export function formatDashboardDate(date: Date | string) {
  return new Intl.DateTimeFormat('en-NG', { timeZone: 'Africa/Lagos', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date))
}

export const propertyReviewStatuses = {
  PENDING: { label: 'Pending verification', className: 'bg-amber-50 text-amber-700' },
  VERIFIED: { label: 'Approved', className: 'bg-emerald-50 text-brand-forest' },
  REJECTED: { label: 'Rejected', className: 'bg-red-50 text-red-600' },
  SOLD: { label: 'Sold', className: 'bg-gray-100 text-gray-600' },
  RENTED: { label: 'Rented', className: 'bg-blue-50 text-blue-700' },
} satisfies Record<Property['status'], { label: string; className: string }>
