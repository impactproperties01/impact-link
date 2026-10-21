import type { Prisma, PropertyType } from '@prisma/client'

export type MarketplaceParams = Record<string, string | string[] | undefined>
export const listingTabs = [
  { value: 'rent', label: 'Rent', listingType: 'RENTAL', heading: 'Properties for rent' },
  { value: 'buy', label: 'Buy', listingType: 'SALE', heading: 'Properties for sale' },
  { value: 'shortlet', label: 'Shortlet', listingType: 'SHORTLET', heading: 'Shortlets' },
  { value: 'lease', label: 'Lease', listingType: 'LEASE', heading: 'Properties for lease' },
] as const
export const propertyTypes = ['APARTMENT', 'HOUSE', 'DUPLEX', 'LAND', 'COMMERCIAL', 'OTHER'] as const

function single(value: string | string[] | undefined) {
  return typeof value === 'string' ? value : ''
}
function price(value: string | string[] | undefined) {
  const text = single(value).trim()
  const number = Number(text)
  return text && Number.isFinite(number) && number >= 0 && number <= 1e12 ? number : undefined
}

export function parseMarketplaceFilters(params: MarketplaceParams) {
  const tab = listingTabs.find((item) => item.value === single(params.listing)) || listingTabs[0]
  const propertyType = propertyTypes.find((type) => type === single(params.propertyType))
  const bedrooms = ['1', '2', '3', '4', '5+'].find((value) => value === single(params.bedrooms)) || ''
  const duration = tab.value === 'rent' && ['1 year', '6 months'].includes(single(params.duration)) ? single(params.duration) : ''
  const sort = ['price-low', 'price-high'].includes(single(params.sort)) ? single(params.sort) : 'newest'
  const pageValue = Number(single(params.page))
  return {
    listing: tab.value, listingType: tab.listingType, heading: tab.heading,
    q: single(params.q).trim().slice(0, 100),
    minPrice: price(params.minPrice), maxPrice: price(params.maxPrice),
    propertyType, bedrooms, duration, sort,
    page: Number.isInteger(pageValue) && pageValue > 0 ? Math.min(pageValue, 10000) : 1,
  }
}
export type MarketplaceFilters = ReturnType<typeof parseMarketplaceFilters>

export function marketplaceHref(filters: MarketplaceFilters, changes: Partial<MarketplaceFilters> = {}) {
  const next = { ...filters, ...changes }
  const params = new URLSearchParams({ listing: next.listing })
  if (next.q) params.set('q', next.q)
  if (next.minPrice !== undefined) params.set('minPrice', String(next.minPrice))
  if (next.maxPrice !== undefined) params.set('maxPrice', String(next.maxPrice))
  if (next.propertyType) params.set('propertyType', next.propertyType)
  if (next.bedrooms) params.set('bedrooms', next.bedrooms)
  if (next.listing === 'rent' && next.duration) params.set('duration', next.duration)
  if (next.sort !== 'newest') params.set('sort', next.sort)
  if (next.page > 1) params.set('page', String(next.page))
  return `/?${params.toString()}`
}

export function marketplaceQuery(filters: MarketplaceFilters) {
  const and: Prisma.PropertyWhereInput[] = []
  if (filters.q) {
    and.push({ OR: ['address', 'locationArea', 'state', 'description', 'title'].map((field) => ({
      [field]: { contains: filters.q, mode: 'insensitive' },
    })) })
  }
  if (filters.bedrooms) {
    const count = filters.bedrooms === '5+' ? 5 : Number(filters.bedrooms)
    const bedroomTypes: Record<string, string[]> = {
      '1': ['Single room', 'Room self contained', 'Room and Parlor Flat'],
      '2': ['2-bedroom Flat'], '3': ['3-bedroom Flat'], '4': ['4-Bedroom Flat'],
    }
    const shortletLabels: Record<string, string[]> = {
      '1': ['1 bedroom'], '2': ['2-bedrooms'], '3': ['3-bedroom'], '4': ['4-bedrooms'], '5+': ['5-bedrooms'],
    }
    and.push({ propertyType: { not: 'LAND' }, OR: [
      { bedrooms: filters.bedrooms === '5+' ? { gte: count } : count },
      { listingType: 'RENTAL', bedroomTypes: { hasSome: bedroomTypes[filters.bedrooms] || [] } },
      { listingType: 'SHORTLET', shortletBedrooms: { in: shortletLabels[filters.bedrooms], mode: 'insensitive' } },
    ] })
  }
  const where: Prisma.PropertyWhereInput = {
    status: 'VERIFIED', listingType: filters.listingType,
    ...(filters.propertyType ? { propertyType: filters.propertyType as PropertyType } : {}),
    ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
      ? { basePrice: { gte: filters.minPrice, lte: filters.maxPrice } } : {}),
    ...(filters.duration ? { tenancyDuration: filters.duration } : {}),
    ...(and.length ? { AND: and } : {}),
  }
  const orderBy: Prisma.PropertyOrderByWithRelationInput[] = filters.sort === 'price-low'
    ? [{ basePrice: 'asc' }, { id: 'asc' }]
    : filters.sort === 'price-high'
      ? [{ basePrice: 'desc' }, { id: 'asc' }]
      : [{ createdAt: 'desc' }, { id: 'asc' }]
  return { where, orderBy }
}
