import Image from 'next/image'
import Link from 'next/link'
import { BadgeCheck, MapPin, Bed, Bath, Maximize, Building2 } from 'lucide-react'
import type { Property } from '@prisma/client'
import { formatNaira, getListingTitle, getListingPricing } from '@/lib/property-display'

type PropertyCardProps = {
  property: Pick<Property,
    'id' | 'listingType' | 'propertyType' | 'address' | 'basePrice' | 'locationArea' |
    'bedrooms' | 'bathrooms' | 'bedroomTypes' | 'shortletBedrooms' | 'size' |
    'images' | 'status' | 'tenancyDuration' | 'unitPrices' | 'totalUnits' | 'availableUnits'
  >
}

export default function PropertyCard({ property }: PropertyCardProps) {
  if (property.status !== 'VERIFIED') return null

  const title = getListingTitle(property)
  const isRentalApartment = property.listingType === 'RENTAL' && property.propertyType === 'APARTMENT'
  const { price, hasPriceRange, priceSuffix } = getListingPricing(property)
  const listingLabel = property.listingType === 'SALE' ? 'For sale' : property.listingType === 'SHORTLET' ? 'Shortlet' : 'For rent'
  const showRooms = property.propertyType !== 'LAND'
  const hasAttributes = (showRooms && (property.bedrooms > 0 || property.bathrooms > 0)) ||
    (property.size !== null && property.size > 0) ||
    (isRentalApartment && (property.totalUnits !== null || property.availableUnits !== null))

  return (
    <Link href={`/properties/${property.id}`} aria-label={`View listing: ${title}`} className="flex h-full flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 transition hover:shadow-md hover:border-brand-emerald focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest focus-visible:ring-offset-2">
      <div className="relative h-48 w-full bg-gray-100">
        {property.images[0] ? (
          <Image
            src={property.images[0]}
            alt={title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 260px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
            <Building2 className="h-10 w-10" aria-hidden="true" />
            <span className="text-sm">No photo provided</span>
          </div>
        )}
        <div className="absolute top-3 left-3 bg-brand-forest text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
          <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Verified
        </div>
        <span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-dark">
          {listingLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="mb-2 font-bold text-lg text-brand-dark">
          {hasPriceRange && <span className="text-sm font-normal text-gray-500">From </span>}
          {formatNaira(price)}{' '}
          {priceSuffix && <span className="text-sm font-normal text-gray-500">{priceSuffix}</span>}
        </p>
        <h3 className="text-brand-dark font-medium mb-2 leading-snug">{title}</h3>
        {(property.locationArea || property.address) && (
          <p className="flex items-start text-gray-500 text-sm mb-4">
            <MapPin className="w-4 h-4 mr-1 shrink-0 mt-0.5" aria-hidden="true" />
            {property.locationArea || property.address}
          </p>
        )}
        {hasAttributes && (
          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 pt-3 text-gray-600 text-sm">
            {showRooms && property.bedrooms > 0 && (
              <span className="flex items-center gap-1"><Bed className="w-4 h-4" aria-hidden="true" />{property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}</span>
            )}
            {showRooms && property.bathrooms > 0 && (
              <span className="flex items-center gap-1"><Bath className="w-4 h-4" aria-hidden="true" />{property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}</span>
            )}
            {property.size !== null && property.size > 0 && (
              <span className="flex items-center gap-1"><Maximize className="w-4 h-4" aria-hidden="true" />{property.size} sqm</span>
            )}
            {isRentalApartment && property.totalUnits !== null && (
              <span>{property.totalUnits} {property.totalUnits === 1 ? 'unit' : 'units'}</span>
            )}
            {isRentalApartment && property.availableUnits !== null && (
              <span>{property.availableUnits} available</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
