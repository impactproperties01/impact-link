import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import TenantsClient from './TenantsClient'
import { getListingTitle } from '@/lib/property-display'
import { serializeTenantUnit } from '@/lib/tenant-management'

export const metadata = { title: 'All Tenants | Impact Link' }

export default async function GlobalTenantsPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) redirect('/login')

  const propertySelect = {
    id: true, address: true, listingType: true, propertyType: true,
    bedroomTypes: true, shortletBedrooms: true, tenancyDuration: true,
  } as const
  const [units, properties] = await Promise.all([
    prisma.unit.findMany({
      where: { property: { ownerId: userId } },
      select: {
        id: true, propertyId: true, name: true, type: true, price: true, status: true,
        tenantId: true, tenantName: true, tenantPhone: true, rentStartDate: true, rentEndDate: true,
        property: { select: propertySelect },
      },
      orderBy: [{ rentEndDate: { sort: 'asc', nulls: 'last' } }, { name: 'asc' }, { id: 'asc' }],
    }),
    prisma.property.findMany({ where: { ownerId: userId }, select: propertySelect, orderBy: [{ address: 'asc' }, { id: 'asc' }] }),
  ])

  return <TenantsClient units={units.map((unit) => serializeTenantUnit(unit, unit.property))} properties={properties.map((property) => ({ id: property.id, title: getListingTitle(property), address: property.address }))} asOf={new Date().toISOString()} />
}
