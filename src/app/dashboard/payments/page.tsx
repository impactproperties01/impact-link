import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/admin'
import { getOwnerPayments } from '@/lib/dashboard-data'
import PaymentsClient from './PaymentsClient'

export const metadata = { title: 'Payments & Financials | Impact Link' }

export default async function GlobalPaymentsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const params = await searchParams
  const data = await getOwnerPayments(user.id, Number(params.page) || 1)
  return <PaymentsClient {...data} />
}
