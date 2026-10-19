import { cache } from 'react'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'

export const getCurrentUser = cache(async () => {
  const session = await auth()
  if (!session?.user?.id) return null

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, name: true, email: true },
  })
})

export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'ADMIN') notFound()
  return user
}
