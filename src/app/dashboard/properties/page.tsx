import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import PropertiesClient from './PropertiesClient'

export const metadata = { title: 'My Properties | Impact Link' }

export default async function PropertiesPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return null 
  }

  // Fetch live properties from your database
  const liveProperties = await prisma.property.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: 'desc' }
  })

  // Clean and format the data using your exact smart title logic
  const formattedProperties = liveProperties.map(prop => {
    
    const isRent = prop.listingType === 'RENTAL'
    const isSale = prop.listingType === 'SALE'
    const isShortlet = prop.listingType === 'SHORTLET'
    const isLand = prop.propertyType === 'LAND'
    const isApartment = prop.propertyType === 'APARTMENT'
    const isHouse = prop.propertyType === 'HOUSE'

    const addressStr = prop.address || 'Address not specified'

    let generatedTitle = 'Untitled Property'

    // Exact replica of your Step 6 Preview title rules
    if (isRent && isApartment) {
      const beds = (prop.bedroomTypes && prop.bedroomTypes.length > 0)
        ? prop.bedroomTypes.join(', ')
        : 'Apartment'
      generatedTitle = `${beds} available for rent in ${addressStr}`
    } else if (isRent && isLand) {
      generatedTitle = `Land for rent in ${addressStr}`
    } else if (isSale) {
      const pType = isHouse ? 'House' : isLand ? 'Land' : prop.propertyType.toLowerCase()
      generatedTitle = `${pType} for sale in ${addressStr}`
    } else if (isShortlet) {
      const sBed = prop.shortletBedrooms || 'Apartment'
      generatedTitle = `${sBed} available for shortlet in ${addressStr}`
    } else {
      generatedTitle = `${prop.propertyType.toLowerCase()} in ${addressStr}`
    }

    // Unit counts are only collected for rental apartments.
    const units = isRent && isApartment ? prop.totalUnits : null
    const vacant = isRent && isApartment ? prop.availableUnits : null
    const occupied = units !== null && vacant !== null
      ? Math.max(0, units - vacant)
      : null

    return {
      id: prop.id,
      title: generatedTitle,
      location: addressStr,
      price: `₦${prop.basePrice?.toLocaleString() || '0'}`,
      interval: isRent ? ' / year' : isShortlet ? ' / night' : '',
      listingType: isRent ? 'For Rent' : isShortlet ? 'Shortlet' : 'For Sale',
      status: prop.status === 'VERIFIED' ? 'Approved' : prop.status === 'PENDING' ? 'Pending' : prop.status === 'REJECTED' ? 'Rejected' : 'Draft',
      units,
      occupied,
      vacant,
      imagesCount: prop.images?.length || 0,
      image: prop.images?.[0] || '/hero-image.png'
    }
  })

  return <PropertiesClient initialProperties={formattedProperties} />
}