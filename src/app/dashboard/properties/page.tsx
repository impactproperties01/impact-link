import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/admin'
import { getPropertyOccupancy, propertyReviewStatuses } from '@/lib/dashboard-metrics'
import { formatNaira, getListingPricing, getListingTitle } from '@/lib/property-display'
import PropertiesClient from './PropertiesClient'

export const metadata = { title: 'My Properties | Impact Link' }

export default async function PropertiesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const properties = await prisma.property.findMany({
    where: { ownerId: user.id },
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    select: {
      id: true, listingType: true, propertyType: true, address: true, basePrice: true,
      bedroomTypes: true, shortletBedrooms: true, status: true, images: true,
      tenancyDuration: true, unitPrices: true, totalUnits: true, availableUnits: true,
      units: { select: { status: true } },
    },
  })

  const formattedProperties = properties.map((property) => {
    const pricing = getListingPricing(property)
    const occupancy = getPropertyOccupancy(property)
    const hasUnits = occupancy.total > 0 || (property.listingType === 'RENTAL' && property.propertyType === 'APARTMENT')
    return {
      id: property.id,
      title: getListingTitle(property),
      location: property.address || 'Address not specified',
      price: `${pricing.hasPriceRange ? 'From ' : ''}${formatNaira(pricing.price)}`,
      interval: pricing.priceSuffix,
      listingType: { RENTAL: 'For Rent', SALE: 'For Sale', SHORTLET: 'Shortlet', LEASE: 'For Lease' }[property.listingType],
      status: propertyReviewStatuses[property.status].label,
      units: hasUnits ? occupancy.total : null,
      occupied: hasUnits ? occupancy.occupied : null,
      vacant: hasUnits ? occupancy.vacant : null,
      unknownUnits: occupancy.unknown,
      imagesCount: property.images.length,
      image: property.images[0] || null,
    }
  })

  return <PropertiesClient initialProperties={formattedProperties} />
}
