'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Receipt, ExternalLink } from 'lucide-react'
import { formatNaira, formatUnitName } from '@/lib/property-display'
import { formatDashboardDate, type DashboardPaymentRecord } from '@/lib/dashboard-metrics'

type PaymentsClientProps = {
  payments: DashboardPaymentRecord[]
  summary: { rentCollected: number; outstanding: number; year: number }
  totalPayments: number
  totalPages: number
  page: number
  paginationHref?: string
}

export default function PaymentsClient({ payments, summary, totalPayments, totalPages, page, paginationHref = '/dashboard/payments' }: PaymentsClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const query = searchTerm.trim().toLowerCase()
  const filteredPayments = payments.filter((payment) => `${payment.tenantName} ${payment.propertyAddress} ${payment.status}`.toLowerCase().includes(query))

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      <header><h1 className="text-2xl font-extrabold text-brand-dark md:text-3xl">Payments &amp; Financials</h1><p className="mt-2 text-sm text-gray-500">Track recorded rent payments across your properties.</p></header>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100 bg-white p-5"><p className="text-sm font-semibold text-gray-500">Rent Collected</p><p className="mt-2 text-2xl font-extrabold text-brand-forest">{formatNaira(summary.rentCollected)}</p><p className="mt-2 text-xs text-gray-400">Recorded payments in {summary.year}</p></div>
        <div className="rounded-2xl border border-red-100 bg-white p-5"><p className="text-sm font-semibold text-gray-500">Outstanding Rent</p><p className="mt-2 text-2xl font-extrabold text-red-600">{formatNaira(summary.outstanding)}</p><p className="mt-2 text-xs text-gray-400">Unpaid rent due today or earlier</p></div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5"><p className="text-sm font-semibold text-gray-500">Payment Records</p><p className="mt-2 text-2xl font-extrabold text-brand-dark">{totalPayments}</p><p className="mt-2 text-xs text-gray-400">Paid and unpaid rent across your portfolio</p></div>
      </div>
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="border-b border-gray-100 p-4"><label className="relative block sm:max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" aria-hidden="true" /><span className="sr-only">Search payments on this page</span><input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search this page by tenant, property or status" className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand-forest" /></label></div>
        {filteredPayments.length ? (
          <div className="overflow-x-auto"><table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Tenant &amp; property</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Due date</th><th className="px-4 py-3">Date paid</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Receipt</th></tr></thead>
            <tbody className="divide-y divide-gray-100">{filteredPayments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50/50">
                <td className="min-w-48 px-4 py-4"><p className="font-bold text-brand-dark">{payment.tenantName}</p>{payment.unitName && <p className="mt-1 text-xs text-gray-500">Unit: {formatUnitName(payment.unitName)}</p>}<Link href={`/dashboard/properties/${payment.propertyId}`} className="mt-1 block text-xs text-brand-forest hover:underline">{payment.propertyAddress}</Link></td>
                <td className="whitespace-nowrap px-4 py-4 font-bold">{formatNaira(payment.amount)}</td>
                <td className="whitespace-nowrap px-4 py-4 text-gray-500">{formatDashboardDate(payment.dueDate)}</td>
                <td className="whitespace-nowrap px-4 py-4 text-gray-500">{payment.datePaid ? formatDashboardDate(payment.datePaid) : 'Not recorded'}</td>
                <td className="px-4 py-4"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${payment.status === 'Paid' ? 'bg-emerald-50 text-brand-forest' : payment.status === 'Overdue' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>{payment.status}</span></td>
                <td className="px-4 py-4">{payment.receiptUrl ? <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-forest hover:underline">Receipt<ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a> : <span className="text-xs text-gray-400">Not uploaded</span>}</td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : (
          <div className="flex flex-col items-center gap-3 px-5 py-14 text-center"><Receipt className="h-10 w-10 text-gray-300" aria-hidden="true" /><h2 className="font-bold text-brand-dark">{payments.length ? 'No matching payments' : 'No payment records yet'}</h2><p className="max-w-md text-sm text-gray-500">{payments.length ? 'Try another search on this page.' : 'Recorded rent payments will appear here. An occupied unit or a renewed rent period does not by itself confirm that money was received.'}</p></div>
        )}
      </section>
      {totalPages > 1 && <nav aria-label="Payment pages" className="flex items-center justify-between gap-3 text-sm"><span className="text-gray-500">Page {page} of {totalPages}</span><div className="flex gap-3">{page > 1 && <Link href={`${paginationHref}?page=${page - 1}`} className="rounded-xl border border-gray-200 bg-white px-4 py-2 font-semibold">Previous</Link>}{page < totalPages && <Link href={`${paginationHref}?page=${page + 1}`} className="rounded-xl bg-brand-forest px-4 py-2 font-semibold text-white">Next</Link>}</div></nav>}
    </div>
  )
}
