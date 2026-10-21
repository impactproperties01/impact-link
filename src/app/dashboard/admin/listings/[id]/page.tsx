import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { formatNaira, getListingTitle } from '@/lib/property-display'
import ReviewActions from '@/components/admin/ReviewActions'
import { getPropertyFees } from '@/lib/property-fees'
import InspectionContact from '@/components/properties/InspectionContact'
import PropertyRelationshipDetails from '@/components/properties/PropertyRelationshipDetails'

export const metadata = { title: 'Review Listing | Impact Link' }

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex justify-between gap-4 border-b border-gray-100 py-3 last:border-0"><dt className="text-sm text-gray-500">{label}</dt><dd className="text-right text-sm font-semibold text-brand-dark break-words">{value}</dd></div>
}

export default async function ReviewListingPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const property = await prisma.property.findUnique({
    where: { id },
    include: { owner: { select: { name: true, email: true, phone: true } } },
  })
  if (!property) notFound()

  const title = getListingTitle(property)
  const isSale = property.listingType === 'SALE'
  const isLease = property.listingType === 'LEASE'
  const isRentalApartment = property.listingType === 'RENTAL' && property.propertyType === 'APARTMENT'
  const description = isSale || isLease ? [property.title, property.description].filter(Boolean).join('\n\n') : property.description
  const status = property.status === 'VERIFIED' ? 'Approved' : property.status === 'PENDING' ? 'Pending' : property.status === 'REJECTED' ? 'Rejected' : property.status.toLowerCase()
  const unitPrices = property.unitPrices && typeof property.unitPrices === 'object' && !Array.isArray(property.unitPrices)
    ? Object.entries(property.unitPrices).filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1]))
    : []
  const dateOptions = { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Lagos' } as const
  const { platformFee } = getPropertyFees(property)
  const fees = [
    ['Service charge', property.serviceCharge],
    ['Caution fee', property.cautionFee],
    ['Agreement fee', property.legalFee],
    ['Agency fee', property.agencyFee],
    ['Installmental price', property.installmentalPrice],
  ] as const

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href="/dashboard/admin/listings" className="inline-flex items-center gap-2 text-sm font-bold text-brand-forest"><ArrowLeft className="h-4 w-4" /> Back to Listing Reviews</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Listing review</p><h1 className="text-2xl md:text-3xl font-extrabold text-brand-dark capitalize">{title}</h1><p className="mt-2 text-sm text-gray-500 flex items-center gap-1.5"><MapPin className="h-4 w-4 shrink-0" />{property.address}</p></div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${property.status === 'PENDING' ? 'bg-amber-50 text-amber-700' : property.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700' : property.status === 'REJECTED' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{status}</span>
      </div>
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        <div className="space-y-6 lg:col-span-2">
          <section aria-labelledby="listing-photos" className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5">
            <h2 id="listing-photos" className="mb-4 text-lg font-extrabold text-brand-dark">Photos ({property.images.length})</h2>
            {property.images.length ? <div className="grid grid-cols-2 gap-3">{property.images.map((src, index) => <a key={`${src}-${index}`} href={src} target="_blank" rel="noopener noreferrer" aria-label={`Open property photo ${index + 1}`} className={`relative overflow-hidden rounded-xl bg-gray-100 ${index === 0 ? 'col-span-2 aspect-[16/10]' : 'aspect-[4/3]'}`}><Image src={src} alt={`${title}, photo ${index + 1}`} fill unoptimized className="object-cover" /></a>)}</div> : <p className="text-sm text-gray-500">No photos were submitted.</p>}
          </section>
          <section className="rounded-2xl border border-gray-100 bg-white p-5">
            <h2 className="text-lg font-extrabold text-brand-dark">Property details</h2>
            <dl className="mt-2">
              <DetailRow label="Listing type" value={<span className="capitalize">{property.listingType.toLowerCase()}</span>} />
              <DetailRow label="Property type" value={<span className="capitalize">{property.propertyType.toLowerCase()}</span>} />
              {property.bedroomTypes.length > 0 && <DetailRow label="Bedroom types" value={property.bedroomTypes.join(', ')} />}
              {property.shortletBedrooms && <DetailRow label="Shortlet bedrooms" value={property.shortletBedrooms} />}
              {isRentalApartment && property.totalUnits !== null && <DetailRow label="Total units" value={property.totalUnits} />}
              {isRentalApartment && property.availableUnits !== null && <DetailRow label="Available units" value={property.availableUnits} />}
              {property.size !== null && <DetailRow label="Size" value={`${property.size} sqm`} />}
              {property.bedrooms > 0 && <DetailRow label="Bedrooms" value={property.bedrooms} />}
              {property.bathrooms > 0 && <DetailRow label="Bathrooms" value={property.bathrooms} />}
              {property.toilets !== null && property.toilets > 0 && <DetailRow label="Toilets" value={property.toilets} />}
              {property.parkingSpaces !== null && property.parkingSpaces > 0 && <DetailRow label="Parking spaces" value={property.parkingSpaces} />}
              <DetailRow label="Full address" value={property.address} />
            </dl>
            <h3 className="mt-5 text-sm font-bold text-brand-dark">Submitted description</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{description || 'No description was submitted.'}</p>
          </section>
          <PropertyRelationshipDetails {...property} />
          {property.features && (
            <section className="rounded-2xl border border-gray-100 bg-white p-5">
              <h2 className="text-lg font-bold text-brand-dark">Features of Property</h2>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-600">{property.features}</p>
            </section>
          )}
          <section className="rounded-2xl border border-gray-100 bg-white p-5">
            <h2 className="text-lg font-extrabold text-brand-dark">Declared documents</h2>
            <p className="mt-1 text-sm text-gray-500">Document types selected by the owner.</p>
            {property.documents.length ? <ul className="mt-4 space-y-2">{property.documents.map((document, index) => <li key={`${document}-${index}`} className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-brand-dark">{document}</li>)}</ul> : <p className="mt-3 text-sm text-gray-500">No document types were selected.</p>}
          </section>
        </div>
        <div className="space-y-6">
          <InspectionContact name={property.inspectionContactName} phone={property.inspectionContactPhone} />
          <section className="rounded-2xl border border-gray-100 bg-white p-5">
            <h2 className="text-lg font-extrabold text-brand-dark">Submitted pricing</h2>
            <p className="mt-3 text-2xl font-extrabold text-brand-forest">{formatNaira(property.basePrice)}</p>
            <p className="mt-1 text-sm text-gray-500">{property.listingType === 'SHORTLET' ? 'Per night' : isSale ? 'Outright price' : isLease ? 'Price per year' : `Rent / ${property.tenancyDuration || 'year'}`}</p>
            <dl className="mt-3">{unitPrices.map(([type, price]) => <DetailRow key={type} label={type} value={formatNaira(price)} />)}{fees.map(([label, amount]) => amount !== null && <DetailRow key={label} label={label} value={formatNaira(amount)} />)}{property.commissionPct !== null && <DetailRow label={`Platform fee (${property.commissionPct}%)`} value={formatNaira(platformFee)} />}</dl>
          </section>
          <section className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3">
            <h2 className="text-lg font-extrabold text-brand-dark">Property owner</h2>
            <p className="font-bold text-brand-dark">{property.owner.name || 'Name not provided'}</p>
            <a href={`mailto:${property.owner.email}`} className="flex items-center gap-2 break-all text-sm text-brand-forest"><Mail className="h-4 w-4 shrink-0" />{property.owner.email}</a>
            {property.owner.phone && <a href={`tel:${property.owner.phone}`} className="flex items-center gap-2 text-sm text-gray-600"><Phone className="h-4 w-4" />{property.owner.phone}</a>}
            <div className="border-t border-gray-100 pt-3 space-y-2 text-xs text-gray-500"><p>Submitted {property.createdAt.toLocaleString('en-NG', dateOptions)}</p><p>Last updated {property.updatedAt.toLocaleString('en-NG', dateOptions)}</p></div>
          </section>
          {property.status === 'PENDING' ? <ReviewActions propertyId={property.id} /> : <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500">This listing is {status.toLowerCase()}. Only pending listings can receive a review decision.</div>}
        </div>
      </div>
    </div>
  )
}
