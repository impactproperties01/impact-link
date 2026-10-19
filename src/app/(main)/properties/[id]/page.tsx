import Image from 'next/image'
import Link from 'next/link'
import { connection } from 'next/server'
import { notFound } from 'next/navigation'
import { z } from 'zod'
import { ArrowLeft, BadgeCheck, Building2, MapPin } from 'lucide-react'
import type { Property } from '@prisma/client'
import prisma from '@/lib/prisma'
import { formatNaira, getListingTitle, getListingPricing } from '@/lib/property-display'
import { getPropertyFees } from '@/lib/property-fees'
import ScheduleInspection from '@/components/marketplace/ScheduleInspection'

export const metadata = { title: 'Property details | Impact Link' }

type PricingFields = Pick<Property,
  'listingType' | 'basePrice' | 'legalFee' | 'commissionPct' | 'cautionFee' | 'agencyFee' | 'serviceCharge'
>

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-3 last:border-0">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="break-words text-right text-sm font-semibold text-brand-dark">{value}</dd>
    </div>
  )
}

function PriceBreakdown({ property, price, label }: { property: PricingFields; price: number; label: string }) {
  const { agreementFee, platformFee, platformPct } = getPropertyFees(property, price)
  const fees: [string, number][] = []
  if (property.listingType === 'RENTAL' && property.legalFee !== null) fees.push(['Agreement fee', agreementFee])
  if (property.listingType !== 'SALE' && property.commissionPct !== null) fees.push([`Platform fee (${platformPct}%)`, platformFee])
  for (const [name, amount] of [
    ['Caution fee', property.cautionFee],
    ['Service charge', property.serviceCharge],
    ['Agency fee', property.agencyFee],
  ] as const) {
    if (amount !== null && amount > 0) fees.push([name, amount])
  }
  return (
    <dl>
      <DetailRow label={label} value={formatNaira(price)} />
      {fees.map(([name, amount]) => <DetailRow key={name} label={name} value={formatNaira(amount)} />)}
      {fees.length > 0 && <DetailRow label="Total listed amount" value={formatNaira(price + fees.reduce((total, [, amount]) => total + amount, 0))} />}
    </dl>
  )
}

export default async function PropertyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await connection()
  const { id } = await params
  if (!z.string().uuid().safeParse(id).success) notFound()

  const property = await prisma.property.findFirst({
    where: { id, status: 'VERIFIED' },
    select: {
      id: true, title: true, description: true, address: true,
      listingType: true, propertyType: true, status: true, images: true,
      bedrooms: true, bathrooms: true, toilets: true, parkingSpaces: true, size: true,
      bedroomTypes: true, totalUnits: true, availableUnits: true, shortletBedrooms: true,
      basePrice: true, unitPrices: true, tenancyDuration: true, installmentalPrice: true,
      serviceCharge: true, cautionFee: true, legalFee: true, agencyFee: true, commissionPct: true,
    },
  })
  if (!property || property.status !== 'VERIFIED') notFound()

  const title = getListingTitle(property)
  const { price, priceSuffix, hasPriceRange, unitPrices } = getListingPricing(property)
  const isRentalApartment = property.listingType === 'RENTAL' && property.propertyType === 'APARTMENT'
  const isSale = property.listingType === 'SALE'
  const showRooms = property.propertyType !== 'LAND'
  const category = isSale ? 'buy' : property.listingType === 'SHORTLET' ? 'shortlet' : 'rent'
  const listingLabel = isSale ? 'For sale' : property.listingType === 'SHORTLET' ? 'Shortlet' : 'For rent'
  const priceLabel = isSale ? 'Outright price' : property.listingType === 'SHORTLET' ? 'Price per night' : 'Rent'
  const description = [...new Set([...(isSale ? [property.title] : []), property.description].map((text) => text.trim()).filter(Boolean))].join('\n\n')

  return (
    <div className="space-y-6 px-4 py-6 pb-28 md:px-8 md:py-10">
      <Link href={`/?listing=${category}`} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-forest hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to properties
      </Link>
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-forest px-3 py-1 text-xs font-semibold text-white"><BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />Verified listing</span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-brand-forest">{listingLabel}</span>
        </div>
        <h1 className="max-w-4xl text-2xl font-extrabold leading-tight text-brand-dark md:text-3xl">{title}</h1>
        <p className="flex items-start gap-1.5 text-sm text-gray-500"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{property.address}</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section aria-labelledby="listing-photos" className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5">
            <h2 id="listing-photos" className="mb-4 text-lg font-bold text-brand-dark">Photos ({property.images.length})</h2>
            {property.images.length ? (
              <div className="grid grid-cols-2 gap-3">
                {property.images.map((src, index) => (
                  <a key={`${src}-${index}`} href={src} target="_blank" rel="noopener noreferrer" aria-label={`Open property photo ${index + 1}`} className={`relative overflow-hidden rounded-xl bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest ${index === 0 ? 'col-span-2 aspect-[16/10]' : 'aspect-[4/3]'}`}>
                    <Image src={src} alt={`${title}, photo ${index + 1}`} fill sizes={index === 0 ? '(min-width: 1024px) 60vw, 100vw' : '(min-width: 1024px) 30vw, 50vw'} className="object-cover" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="flex aspect-[16/10] flex-col items-center justify-center gap-2 rounded-xl bg-gray-50 text-gray-400"><Building2 className="h-12 w-12" aria-hidden="true" /><p className="text-sm">No photos provided.</p></div>
            )}
          </section>
          <section className="rounded-2xl border border-gray-100 bg-white p-5">
            <h2 className="text-lg font-bold text-brand-dark">About this property</h2>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-600">{description || 'No description provided.'}</p>
          </section>
          <section className="rounded-2xl border border-gray-100 bg-white p-5">
            <h2 className="text-lg font-bold text-brand-dark">Property details</h2>
            <dl className="mt-2">
              <DetailRow label="Listing type" value={listingLabel} />
              <DetailRow label="Property type" value={<span className="capitalize">{property.propertyType.toLowerCase()}</span>} />
              {isRentalApartment && property.bedroomTypes.length > 0 && <DetailRow label="Apartment types" value={property.bedroomTypes.join(', ')} />}
              {property.listingType === 'SHORTLET' && property.shortletBedrooms && <DetailRow label="Bedrooms" value={property.shortletBedrooms} />}
              {showRooms && property.bedrooms > 0 && <DetailRow label="Bedrooms" value={property.bedrooms} />}
              {showRooms && property.bathrooms > 0 && <DetailRow label="Bathrooms" value={property.bathrooms} />}
              {showRooms && property.toilets !== null && property.toilets > 0 && <DetailRow label="Toilets" value={property.toilets} />}
              {property.parkingSpaces !== null && property.parkingSpaces > 0 && <DetailRow label="Parking spaces" value={property.parkingSpaces} />}
              {property.size !== null && property.size > 0 && <DetailRow label="Size" value={`${property.size} sqm`} />}
              {isRentalApartment && property.totalUnits !== null && <DetailRow label="Total units" value={property.totalUnits} />}
              {isRentalApartment && property.availableUnits !== null && <DetailRow label="Available units" value={property.availableUnits} />}
              {property.listingType === 'RENTAL' && property.tenancyDuration && <DetailRow label="Tenancy" value={property.tenancyDuration} />}
              <DetailRow label="Address" value={property.address} />
            </dl>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6">
          <ScheduleInspection propertyId={property.id} title={title} />
          <section aria-labelledby="listing-pricing" className="rounded-2xl border border-gray-100 bg-white p-5">
            <h2 id="listing-pricing" className="text-lg font-bold text-brand-dark">Pricing &amp; fees</h2>
            <p className="mt-4 text-2xl font-extrabold text-brand-forest">
              {hasPriceRange && <span className="mb-1 block text-sm font-medium text-gray-500">Starting from</span>}
              {formatNaira(price)}{' '}<span className="text-sm font-normal text-gray-500">{priceSuffix}</span>
            </p>
            <p className="mt-1 text-sm text-gray-500">{priceLabel}</p>
            <div className="mt-4 space-y-4">
              {unitPrices.length ? unitPrices.map(([type, amount]) => (
                <section key={type} className="rounded-xl border border-gray-100 p-3">
                  <h3 className="text-sm font-bold text-brand-dark">{type}</h3>
                  <PriceBreakdown property={property} price={amount} label={priceLabel} />
                </section>
              )) : <PriceBreakdown property={property} price={price} label={priceLabel} />}
              {isSale && property.installmentalPrice !== null && property.installmentalPrice > 0 && <dl><DetailRow label="Installmental price" value={formatNaira(property.installmentalPrice)} /></dl>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
