import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import PaymentsClient from './PaymentsClient'

export const metadata = { title: 'Payments & Financials | Impact Link' }

export default async function GlobalPaymentsPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) redirect('/login')

  // Fetch all properties and their internal units for global calculations
  const properties = await prisma.property.findMany({
    where: { ownerId: userId },
    include: { units: true }
  })

  return <PaymentsClient properties={properties} />
}