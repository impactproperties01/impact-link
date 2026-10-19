import Image from 'next/image'
import Link from 'next/link'
import { ClipboardCheck, Search, ArrowRight } from 'lucide-react'
import type { Prisma, PropertyStatus } from '@prisma/client'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { formatNaira, getListingTitle } from '@/lib/property-display'

export const metadata = { title: 'Listing Reviews | Impact Link' }

const tabs = [
  { status: 'PENDING', label: 'Pending' },
  { status: 'VERIFIED', label: 'Approved' },
  { status: 'REJECTED', label: 'Rejected' },
] as const

export default async function ListingReviewsPage({ searchParams }: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>
}) {
  await requireAdmin()
  const query = await searchParams
  const activeTab = tabs.find(tab => tab.status === query.status) || tabs[0]
  const search = typeof query.q === 'string' ? query.q.trim().slice(0, 120) : ''
  const requestedPage = Number(query.page)
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 10000) : 1
  const where: Prisma.PropertyWhereInput = {
    status: activeTab.status,
    ...(search ? { OR: [
      { title: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
      { locationArea: { contains: search, mode: 'insensitive' } },
      { owner: { email: { contains: search, mode: 'insensitive' } } },
      { owner: { name: { contains: search, mode: 'insensitive' } } },
    ] } : {}),
  }
  const [listings, total, counts] = await Promise.all([
    prisma.property.findMany({
      where,
      include: { owner: { select: { name: true, email: true } } },
      orderBy: activeTab.status === 'PENDING' ? { createdAt: 'asc' } : { updatedAt: 'desc' },
      skip: (page - 1) * 20,
      take: 20,
    }),
    prisma.property.count({ where }),
    prisma.property.groupBy({ by: ['status'], _count: { _all: true } }),
  ])
  const countFor = (status: PropertyStatus) => counts.find(group => group.status === status)?._count._all || 0
  const hrefFor = (status: string, nextPage = 1) => `/dashboard/admin/listings?${new URLSearchParams({ status, ...(search ? { q: search } : {}), ...(nextPage > 1 ? { page: String(nextPage) } : {}) })}`
  const totalPages = Math.max(1, Math.ceil(total / 20))

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-brand-forest mb-2"><ClipboardCheck className="h-5 w-5" /><span className="text-xs font-bold uppercase tracking-wider">Admin</span></div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-brand-dark">Listing Reviews</h1>
        <p className="mt-2 text-sm text-gray-500">Review submitted properties before they go live. Pending listings are shown oldest first.</p>
      </div>
      <nav aria-label="Listing review status" className="flex gap-2 overflow-x-auto hide-scrollbar">
        {tabs.map(tab => <Link key={tab.status} href={hrefFor(tab.status)} aria-current={activeTab.status === tab.status ? 'page' : undefined} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold ${activeTab.status === tab.status ? 'bg-brand-forest text-white' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>{tab.label} ({countFor(tab.status)})</Link>)}
      </nav>
      <form action="/dashboard/admin/listings" className="flex gap-2">
        <input type="hidden" name="status" value={activeTab.status} />
        <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><input aria-label="Search listings" name="q" defaultValue={search} placeholder="Search location, title, owner name or email" className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-emerald" /></div>
        <button type="submit" className="rounded-xl bg-brand-forest px-4 text-sm font-bold text-white">Search</button>
      </form>
      <p className="text-sm text-gray-500">{total} {activeTab.label.toLowerCase()} listing{total !== 1 ? 's' : ''}{search ? ` matching “${search}”` : ''}</p>
      <div className="space-y-3">
        {listings.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center"><ClipboardCheck className="mx-auto mb-3 h-10 w-10 text-gray-300" /><h2 className="font-bold text-brand-dark">No listings found</h2><p className="mt-1 text-sm text-gray-500">{search ? 'Try a different search.' : `There are no ${activeTab.label.toLowerCase()} listings to show.`}</p></div>
        ) : listings.map(property => (
          <Link key={property.id} href={`/dashboard/admin/listings/${property.id}`} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-3 md:p-5 shadow-sm transition hover:border-brand-emerald/40">
            <div className="relative h-24 w-24 md:h-28 md:w-36 shrink-0 overflow-hidden rounded-xl"><Image src={property.images[0] || '/hero-image.png'} alt={getListingTitle(property)} fill className="object-cover" unoptimized /></div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-start justify-between gap-2"><h2 className="line-clamp-2 text-sm md:text-base font-extrabold text-brand-dark capitalize">{getListingTitle(property)}</h2><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${property.status === 'PENDING' ? 'bg-amber-50 text-amber-700' : property.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{activeTab.label}</span></div>
              <p className="text-sm font-bold text-brand-forest">{formatNaira(property.basePrice)} <span className="font-normal text-gray-400">{property.listingType === 'RENTAL' ? `/ ${property.tenancyDuration || 'year'}` : property.listingType === 'SHORTLET' ? '/ night' : ''}</span></p>
              <p className="truncate text-xs text-gray-500">{property.owner.name || property.owner.email} · {property.owner.email}</p>
              <div className="flex flex-wrap justify-between gap-2 text-xs text-gray-400"><span>Submitted {property.createdAt.toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos', day: 'numeric', month: 'short', year: 'numeric' })}</span><span className="flex items-center gap-1 font-bold text-brand-forest">{property.status === 'PENDING' ? 'Review listing' : 'View listing'} <ArrowRight className="h-3 w-3" /></span></div>
            </div>
          </Link>
        ))}
      </div>
      {totalPages > 1 && <nav aria-label="Review pages" className="flex items-center justify-between text-sm"><span className="text-gray-500">Page {page} of {totalPages}</span><div className="flex gap-3">{page > 1 && <Link className="rounded-xl border border-gray-200 bg-white px-4 py-2 font-bold" href={hrefFor(activeTab.status, page - 1)}>Previous</Link>}{page < totalPages && <Link className="rounded-xl border border-gray-200 bg-white px-4 py-2 font-bold" href={hrefFor(activeTab.status, page + 1)}>Next</Link>}</div></nav>}
    </div>
  )
}
