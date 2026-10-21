'use client'

import PaymentsClient from '@/app/dashboard/payments/PaymentsClient'
import type { getOwnerPayments } from '@/lib/dashboard-data'

export default function PaymentsTab({ data, propertyId }: { data: Awaited<ReturnType<typeof getOwnerPayments>>; propertyId: string }) {
  return <PaymentsClient {...data} paginationHref={`/dashboard/properties/${propertyId}/manage`} />
}
