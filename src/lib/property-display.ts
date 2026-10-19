type ListingTitleInput = {
  listingType: string
  propertyType: string
  address: string
  bedroomTypes?: string[]
  shortletBedrooms?: string | null
}

export function getListingTitle(property: ListingTitleInput) {
  const address = property.address || 'Address not specified'
  if (property.listingType === 'RENTAL' && property.propertyType === 'APARTMENT') {
    const bedrooms = property.bedroomTypes?.length ? property.bedroomTypes.join(', ') : 'Apartment'
    return `${bedrooms} available for rent in ${address}`
  }
  if (property.listingType === 'RENTAL' && property.propertyType === 'LAND') return `Land for rent in ${address}`
  if (property.listingType === 'SALE') {
    const type = property.propertyType === 'HOUSE' ? 'House' : property.propertyType === 'LAND' ? 'Land' : property.propertyType.toLowerCase()
    return `${type} for sale in ${address}`
  }
  if (property.listingType === 'SHORTLET') return `${property.shortletBedrooms || 'Apartment'} available for shortlet in ${address}`
  return `${property.propertyType.toLowerCase()} in ${address}`
}

export function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount)
}

type ListingPricingInput = Pick<import('@prisma/client').Property,
  'listingType' | 'propertyType' | 'basePrice' | 'unitPrices' | 'bedroomTypes' | 'tenancyDuration'
>

export function getListingPricing(property: ListingPricingInput) {
  const unitPriceMap = property.unitPrices && typeof property.unitPrices === 'object' && !Array.isArray(property.unitPrices)
    ? property.unitPrices
    : null
  const unitPrices: [string, number][] = []
  if (property.listingType === 'RENTAL' && property.propertyType === 'APARTMENT' && unitPriceMap) {
    for (const type of new Set(property.bedroomTypes)) {
      const price = unitPriceMap[type]
      if (typeof price === 'number' && Number.isFinite(price) && price > 0) unitPrices.push([type, price])
    }
  }
  const prices = unitPrices.map(([, price]) => price)
  const priceSuffix = property.listingType === 'SHORTLET'
    ? '/ night'
    : property.listingType === 'RENTAL' && property.tenancyDuration
      ? `/ ${property.tenancyDuration.toLowerCase()}`
      : ''
  return {
    price: prices.length ? Math.min(...prices) : property.basePrice,
    hasPriceRange: new Set(prices).size > 1,
    priceSuffix,
    unitPrices,
  }
}
