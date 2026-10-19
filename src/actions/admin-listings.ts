'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/admin'
import prisma from '@/lib/prisma'

const reviewSchema = z.object({
  propertyId: z.string().uuid(),
  decision: z.enum(['APPROVE', 'REJECT']),
})

export async function reviewListing(propertyId: string, decision: 'APPROVE' | 'REJECT') {
  const actor = await getCurrentUser()
  if (actor?.role !== 'ADMIN') return { success: false, error: 'Only admins can review listings.' }

  const input = reviewSchema.safeParse({ propertyId, decision })
  if (!input.success) return { success: false, error: 'Invalid review request.' }

  try {
    // Check the current status in the same write, so only one pending decision wins.
    const result = await prisma.property.updateMany({
      where: { id: input.data.propertyId, status: 'PENDING' },
      data: { status: input.data.decision === 'APPROVE' ? 'VERIFIED' : 'REJECTED' },
    })
    if (result.count !== 1) return { success: false, error: 'This listing is no longer pending or could not be found. Refresh to see its latest status.' }

    revalidatePath('/dashboard/admin/listings')
    revalidatePath(`/dashboard/admin/listings/${input.data.propertyId}`)
    revalidatePath('/dashboard/properties')
    revalidatePath(`/dashboard/properties/${input.data.propertyId}`)
    revalidatePath(`/dashboard/properties/${input.data.propertyId}/manage`)
    revalidatePath('/dashboard')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Listing review failed:', error)
    return { success: false, error: 'Could not save the decision. Please try again.' }
  }
}
