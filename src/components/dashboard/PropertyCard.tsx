import Image from 'next/image'
import Link from 'next/link'
import { Bath, Bed, Building2, MapPin, Maximize } from 'lucide-react'
import { formatNaira, getListingPricing, getListingTitle } from '@/lib/property-display'
import { getPropertyOccupancy, propertyReviewStatuses, type DashboardProperty } from '@/lib/dashboard-metrics'

export default function DashboardPropertyCard({ property }: { property: DashboardProperty }) {
  const title = getListingTitle(property)
  const pricing = getListingPricing(property)
  const status = propertyReviewStatuses[property.status]
  const occupancy = getPropertyOccupancy(property)
  const listingLabel = { RENTAL: 'For rent', SALE: 'For sale', SHORTLET: 'Shortlet', LEASE: 'For lease' }[property.listingType]
  const showRooms = property.propertyType !== 'LAND'

  return (
    <Link href={`/dashboard/properties/${property.id}`} aria-label={`View property: ${title}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:border-brand-emerald/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest focus-visible:ring-offset-2">
      <div className="relative h-44 bg-gray-100">
        {property.images[0]
          ? <Image src={property.images[0]} alt={title} fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 280px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
          : <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400"><Building2 className="h-9 w-9" aria-hidden="true" /><span className="text-xs">No photo provided</span></div>}
        <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold shadow-sm ${status.className}`}>{status.label}</span>
        <span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-dark">{listingLabel}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-2 line-clamp-2 text-sm font-bold leading-snug text-brand-dark">{title}</h3>
        <p className="mb-3 text-base font-extrabold text-brand-forest">{pricing.hasPriceRange && <span className="text-xs font-medium text-gray-500">From </span>}{formatNaira(pricing.price)} <span className="text-xs font-normal text-gray-500">{pricing.priceSuffix}</span></p>
        <p className="mb-4 flex items-start gap-1.5 text-xs text-gray-500"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />{property.address || 'Address not specified'}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
          {showRooms && property.bedrooms > 0 && <span className="flex items-center gap-1"><Bed className="h-4 w-4" aria-hidden="true" />{property.bedrooms} {property.bedrooms === 1 ? 'bed' : 'beds'}</span>}
          {showRooms && property.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="h-4 w-4" aria-hidden="true" />{property.bathrooms} {property.bathrooms === 1 ? 'bath' : 'baths'}</span>}
          {property.size !== null && property.size > 0 && <span className="flex items-center gap-1"><Maximize className="h-4 w-4" aria-hidden="true" />{property.size} sqm</span>}
          {occupancy.total > 0 && <span>{occupancy.total} {occupancy.total === 1 ? 'unit' : 'units'}</span>}
          {occupancy.total > 0 && <span>{occupancy.occupied} occupied · {occupancy.vacant} vacant</span>}
          {occupancy.unknown > 0 && <span>{occupancy.unknown} awaiting occupancy details</span>}
          {!occupancy.total && !property.size && !(showRooms && (property.bedrooms > 0 || property.bathrooms > 0)) && <span>View property details</span>}
        </div>
      </div>
    </Link>
  )
}
