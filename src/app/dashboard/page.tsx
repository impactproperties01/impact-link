import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, CreditCard, ChevronRight, Home, Building, Users, DoorOpen, FileText, type LucideIcon } from 'lucide-react'
import { getCurrentUser } from '@/lib/admin'
import { getDashboardData } from '@/lib/dashboard-data'
import { formatDashboardDate } from '@/lib/dashboard-metrics'
import { formatNaira, formatUnitName } from '@/lib/property-display'
import DashboardPropertyCard from '@/components/dashboard/PropertyCard'

export const metadata = { title: 'Dashboard | Impact Link' }

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role === 'ADMIN') redirect('/dashboard/admin/listings')
  const data = await getDashboardData(user.id)
  const firstName = user.name?.trim().split(/\s+/)[0] || user.email.split('@')[0]

  return (
    <div className="mx-auto max-w-6xl space-y-6 md:space-y-8">
      <div className="relative flex h-40 items-center overflow-hidden rounded-3xl bg-gradient-to-r from-[#eaf6f0] to-[#f4f9f7] p-6 md:h-44 md:p-10">
        <div className="relative z-10 max-w-[65%]">
          <p className="mb-1 text-sm font-medium text-brand-dark md:text-base">{data.dates.greeting},</p>
          <h1 className="mb-3 break-words text-3xl font-extrabold tracking-tight text-brand-dark md:text-4xl">{firstName}</h1>
          <p className="text-xs leading-relaxed text-gray-600 md:text-sm">Manage your properties, tenants and rent in one place.</p>
        </div>
        <div className="absolute inset-y-0 right-0 w-[40%]"><Image src="/hero-image.png" alt="" fill sizes="40vw" className="object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-[#eaf6f0] via-[#eaf6f0]/40 to-transparent" /></div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:flex md:gap-4">
        <Link href="/properties/new" className="flex items-center justify-center gap-2 rounded-2xl bg-brand-forest px-5 py-3.5 text-sm font-bold text-white transition hover:bg-brand-dark"><Plus className="h-5 w-5" aria-hidden="true" />Add Property</Link>
        <Link href="/dashboard/payments" className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-brand-dark transition hover:bg-gray-50"><CreditCard className="h-5 w-5" aria-hidden="true" />View payments</Link>
      </div>

      <section aria-label="Portfolio overview">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          <StatCard title="Properties" value={data.propertyCount} icon={Home} href="/dashboard/properties" color="bg-emerald-50 text-brand-forest" />
          <StatCard title="Units" value={data.occupancy.total} icon={Building} href="/dashboard/properties" color="bg-blue-50 text-blue-600" />
          <StatCard title="Occupied" value={data.occupancy.occupied} icon={Users} href="/dashboard/tenants" color="bg-teal-50 text-teal-600" />
          <StatCard title="Vacant" value={data.occupancy.vacant} icon={DoorOpen} href="/dashboard/properties" color="bg-orange-50 text-orange-600" />
        </div>
        {data.occupancy.unknown > 0 && <p className="mt-3 text-xs text-gray-500">{data.occupancy.unknown} {data.occupancy.unknown === 1 ? 'unit is' : 'units are'} awaiting occupancy details. Add or update units in your property management pages.</p>}
      </section>

      <section aria-label="Recorded rent payments" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/dashboard/payments" className="relative rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-[#e6f4ed] p-5 md:p-6">
          <p className="mb-2 text-sm font-semibold text-gray-600">Rent Collected</p>
          <p className="text-2xl font-extrabold tracking-tight text-brand-dark">{formatNaira(data.rentCollected)}</p>
          <p className="mt-2 text-xs text-gray-500">Recorded payments in {data.dates.year}</p>
          <ChevronRight className="absolute right-5 top-5 h-5 w-5 text-gray-400" aria-hidden="true" />
        </Link>
        <Link href="/dashboard/payments" className="relative rounded-3xl border border-red-100 bg-gradient-to-br from-rose-50 to-red-50 p-5 md:p-6">
          <p className="mb-2 text-sm font-semibold text-gray-600">Outstanding Rent</p>
          <p className="text-2xl font-extrabold tracking-tight text-brand-dark">{formatNaira(data.outstanding)}</p>
          <p className="mt-2 text-xs text-gray-500">Unpaid rent due today or earlier</p>
          <ChevronRight className="absolute right-5 top-5 h-5 w-5 text-gray-400" aria-hidden="true" />
        </Link>
      </section>

      <section aria-labelledby="my-properties">
        <SectionHeading id="my-properties" title="My Properties" href="/dashboard/properties" />
        {data.properties.length ? (
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 hide-scrollbar md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-3">
            {data.properties.map((property) => <div key={property.id} className="w-[280px] shrink-0 snap-start md:w-auto"><DashboardPropertyCard property={property} /></div>)}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center">
            <Home className="mx-auto mb-3 h-10 w-10 text-gray-300" aria-hidden="true" />
            <h3 className="mb-2 font-bold text-brand-dark">No properties yet</h3>
            <p className="mb-4 text-sm text-gray-500">Your properties will appear here when you add a listing.</p>
            <Link href="/properties/new" className="text-sm font-bold text-brand-forest hover:underline">List your first property</Link>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="rent-due">
          <SectionHeading id="rent-due" title="Rent Due" href="/dashboard/payments" />
          <p className="mb-3 text-xs text-gray-500">Unpaid rent that is overdue or due in the next 30 days.</p>
          <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
            {data.rentDue.length ? data.rentDue.map((payment) => {
              const overdue = payment.dueDate < data.dates.today
              const status = overdue ? 'Overdue' : payment.dueDate < data.dates.tomorrow ? 'Due today' : 'Due soon'
              return (
                <Link key={payment.id} href={`/dashboard/properties/${payment.property.id}/manage`} className="flex items-start justify-between gap-3 p-4 transition hover:bg-gray-50">
                  <div className="min-w-0"><h3 className="break-words text-sm font-bold text-brand-dark">{payment.tenantName}</h3><p className="mt-1 line-clamp-2 text-xs text-gray-500">{payment.property.address}</p><p className="mt-1 text-xs text-gray-500">Due {formatDashboardDate(payment.dueDate)}</p></div>
                  <div className="shrink-0 text-right"><p className="text-sm font-extrabold text-brand-dark">{formatNaira(payment.amount)}</p><span className={`mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-bold ${overdue ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>{status}</span></div>
                </Link>
              )
            }) : <EmptyState text="No unpaid rent is due in the next 30 days." />}
          </div>
        </section>
        <section aria-labelledby="renewals">
          <SectionHeading id="renewals" title="Tenant Renewals" href="/dashboard/tenants" />
          <p className="mb-3 text-xs text-gray-500">Occupied units with rent periods ending within 30 days or already ended.</p>
          <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
            {data.renewals.length ? data.renewals.map((unit) => {
              if (!unit.rentEndDate) return null
              const expired = unit.rentEndDate < data.dates.today
              return (
                <Link key={unit.id} href={`/dashboard/properties/${unit.property.id}/manage`} className="flex items-start justify-between gap-3 p-4 transition hover:bg-gray-50">
                  <div className="min-w-0"><h3 className="text-sm font-bold text-brand-dark">{unit.tenantName || formatUnitName(unit.name)}</h3><p className="mt-1 line-clamp-2 text-xs text-gray-500">{formatUnitName(unit.name)} · {unit.property.address}</p><p className="mt-1 text-xs text-gray-500">Rent period ends {formatDashboardDate(unit.rentEndDate)}</p></div>
                  <div className="shrink-0 text-right"><p className="text-sm font-extrabold text-brand-dark">{formatNaira(unit.price)}</p><p className="mt-1 text-[10px] text-gray-400">Unit rent price</p><span className={`mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-bold ${expired ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>{expired ? 'Rent period ended' : 'Renewal soon'}</span></div>
                </Link>
              )
            }) : <EmptyState text="No tenant renewals are due in the next 30 days." />}
          </div>
        </section>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, href, color }: { title: string; value: number; icon: LucideIcon; href: string; color: string }) {
  return <Link href={href} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md md:p-5"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${color}`}><Icon className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-xs font-semibold text-gray-500">{title}</p><p className="mt-1 text-2xl font-extrabold text-brand-dark">{value}</p></div></Link>
}

function SectionHeading({ id, title, href }: { id: string; title: string; href: string }) {
  return <div className="mb-4 flex items-center justify-between gap-3"><h2 id={id} className="text-lg font-extrabold text-brand-dark">{title}</h2><Link href={href} className="flex items-center gap-1 text-xs font-semibold text-brand-forest hover:underline">View all<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /></Link></div>
}

function EmptyState({ text }: { text: string }) {
  return <div className="flex flex-col items-center gap-3 p-8 text-center text-sm text-gray-500"><FileText className="h-8 w-8 text-gray-300" aria-hidden="true" /><p>{text}</p></div>
}
