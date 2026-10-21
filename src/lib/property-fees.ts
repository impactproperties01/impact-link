const AGREEMENT_PERCENTAGE = 20
const PLATFORM_PERCENTAGE = 20

export function percentageFee(price: number, percentage: number) {
  return Number((price * (percentage / 100)).toFixed(2))
}

// These fees are derived on the server, never accepted from submitted form values.
export function getListingFeeFields(listingType: string, basePrice: number) {
  return {
    legalFee: listingType === 'RENTAL' || listingType === 'LEASE' ? percentageFee(basePrice, AGREEMENT_PERCENTAGE) : 0,
    commissionPct: ['RENTAL', 'SHORTLET', 'LEASE'].includes(listingType) ? PLATFORM_PERCENTAGE : 0,
  }
}

type StoredFees = {
  listingType: string
  basePrice: number
  legalFee?: number | null
  commissionPct?: number | null
}

export function getPropertyFees(property: StoredFees, price = property.basePrice) {
  const defaults = getListingFeeFields(property.listingType, property.basePrice)
  const agreementFee = property.legalFee ?? defaults.legalFee
  const agreementPct = property.basePrice > 0 ? (agreementFee / property.basePrice) * 100 : 0
  const platformPct = property.commissionPct ?? defaults.commissionPct

  return {
    agreementFee: price === property.basePrice ? agreementFee : percentageFee(price, agreementPct),
    platformFee: percentageFee(price, platformPct),
    agreementPct,
    platformPct,
  }
}
