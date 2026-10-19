import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import TenantsClient from './TenantsClient'

export const metadata = { title: 'All Tenants | Impact Link' }

export default async function GlobalTenantsPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) redirect('/login')

  // Fetch all occupied units across EVERY property owned by this user
  const tenants = await prisma.unit.findMany({
    where: {
      status: 'OCCUPIED',
      property: { ownerId: userId }
    },
    include: {
      property: true // Pulls in the property details so we know where the tenant lives
    },
    orderBy: { rentEndDate: 'asc' } // Sort by who owes rent soonest
  })

  return <TenantsClient initialTenants={tenants} />
}