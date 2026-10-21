import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import ManagePropertyClient from './ManagePropertyClient'
import { getOwnerPayments } from '@/lib/dashboard-data'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  await params 
  return { title: 'Manage Property | Impact Link' }
}

export default async function ManagePropertyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string; tab?: string }> }) {
  const { id } = await params 
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) return null

  const property = await prisma.property.findUnique({
    where: {
      id: id,
      ownerId: userId
    },
    include: {
      units: true,
      leases: true
    }
  })

  if (!property) notFound()

  const query = await searchParams
  const now = new Date()
  const paymentData = await getOwnerPayments(userId, Number(query.page) || 1, now, property.id)
  const initialTab = query.page ? 'Payments' : ['Overview', 'Units', 'Tenants', 'Payments', 'Documents'].includes(query.tab || '') ? query.tab! : 'Overview'
  return <ManagePropertyClient key={initialTab} property={property} paymentData={paymentData} initialTab={initialTab} asOf={now.toISOString()} />
}
