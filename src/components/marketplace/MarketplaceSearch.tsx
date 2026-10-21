import Link from 'next/link'
import { Search, Tag, Bed, Building, MoreHorizontal, ChevronDown } from 'lucide-react'
import { propertyTypes, type MarketplaceFilters } from '@/lib/marketplace'

const fieldClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-brand-dark outline-none focus:border-brand-emerald'
const summaryClass = 'flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-brand-dark hover:border-brand-emerald [&::-webkit-details-marker]:hidden'
const panelClass = 'absolute left-0 top-full z-30 mt-2 w-64 space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl'
function ApplyButton() {
  return <button type="submit" className="w-full rounded-xl bg-brand-forest px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark">Apply filters</button>
}
export default function MarketplaceSearch({ filters }: { filters: MarketplaceFilters }) {
  return (
    <form action="/" method="get" className="space-y-4" key={JSON.stringify(filters)} aria-label="Search properties">
      <input type="hidden" name="listing" value={filters.listing} />
      <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm">
        <label className="flex min-w-0 flex-1 items-center pl-3">
          <Search className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
          <span className="sr-only">Area, estate or landmark</span>
          <input name="q" type="search" defaultValue={filters.q} maxLength={100} placeholder="Search by area, estate or landmark" className="ml-2 w-full min-w-0 bg-transparent py-2 text-sm text-brand-dark outline-none placeholder-gray-400" />
        </label>
        <button type="submit" className="rounded-xl bg-brand-forest px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">Search</button>
      </div>
      <div className="relative flex flex-wrap items-center gap-2.5">
        <details name="marketplace-filters">
          <summary className={summaryClass}><Tag className="h-4 w-4 text-gray-500" aria-hidden="true" />Price{filters.minPrice !== undefined || filters.maxPrice !== undefined ? ' •' : ''}<ChevronDown className="h-3 w-3" aria-hidden="true" /></summary>
          <div className={panelClass}>
            <p className="text-xs text-gray-500">Starting price in naira{filters.listing === 'shortlet' ? ' per night' : filters.listing === 'lease' ? ' per year' : ''}</p>
            <label className="block space-y-1 text-sm font-medium">Minimum price<input type="number" name="minPrice" min="0" max="1000000000000" step="any" defaultValue={filters.minPrice ?? ''} placeholder="No minimum" className={fieldClass} /></label>
            <label className="block space-y-1 text-sm font-medium">Maximum price<input type="number" name="maxPrice" min="0" max="1000000000000" step="any" defaultValue={filters.maxPrice ?? ''} placeholder="No maximum" className={fieldClass} /></label>
            <ApplyButton />
          </div>
        </details>
        <details name="marketplace-filters">
          <summary className={summaryClass}><Bed className="h-4 w-4 text-gray-500" aria-hidden="true" />Beds{filters.bedrooms ? `: ${filters.bedrooms}` : ''}<ChevronDown className="h-3 w-3" aria-hidden="true" /></summary>
          <div className={panelClass}>
            <label className="block space-y-1 text-sm font-medium">Bedrooms<select name="bedrooms" defaultValue={filters.bedrooms} className={fieldClass}><option value="">Any bedrooms</option>{['1', '2', '3', '4', '5+'].map((value) => <option key={value} value={value}>{value} {value === '1' ? 'bedroom' : 'bedrooms'}</option>)}</select></label>
            <ApplyButton />
          </div>
        </details>
        <details name="marketplace-filters">
          <summary className={summaryClass}><Building className="h-4 w-4 text-gray-500" aria-hidden="true" />Type{filters.propertyType ? ' •' : ''}<ChevronDown className="h-3 w-3" aria-hidden="true" /></summary>
          <div className={panelClass}>
            <label className="block space-y-1 text-sm font-medium">Property type<select name="propertyType" defaultValue={filters.propertyType || ''} className={fieldClass}><option value="">Any property type</option>{propertyTypes.map((type) => <option key={type} value={type}>{type.charAt(0) + type.slice(1).toLowerCase()}</option>)}</select></label>
            <ApplyButton />
          </div>
        </details>
        <details name="marketplace-filters">
          <summary className={summaryClass}><MoreHorizontal className="h-4 w-4 text-gray-500" aria-hidden="true" />More<ChevronDown className="h-3 w-3" aria-hidden="true" /></summary>
          <div className={panelClass}>
            {filters.listing === 'rent' && <label className="block space-y-1 text-sm font-medium">Tenancy<select name="duration" defaultValue={filters.duration} className={fieldClass}><option value="">Any tenancy</option><option value="1 year">1 year</option><option value="6 months">6 months</option></select></label>}
            <label className="block space-y-1 text-sm font-medium">Sort by<select name="sort" defaultValue={filters.sort} className={fieldClass}><option value="newest">Newest first</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label>
            <ApplyButton />
          </div>
        </details>
        <Link href={`/?listing=${filters.listing}`} className="text-sm font-medium text-brand-forest hover:underline">Reset</Link>
      </div>
      {filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice && <p role="alert" className="text-sm text-red-600">Minimum price must be less than or equal to maximum price.</p>}
    </form>
  )
}
