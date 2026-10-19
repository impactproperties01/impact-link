import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import ManagePropertyClient from './ManagePropertyClient'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  await params 
  return { title: 'Manage Property | Impact Link' }
}

export default async function ManagePropertyPage({ params }: { params: Promise<{ id: string }> }) {
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

  return <ManagePropertyClient property={property} />
}