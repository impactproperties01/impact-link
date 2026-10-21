'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { addTenantSchema, type AddTenantInput } from '@/lib/tenant-management'

export async function addTenantAction(input: AddTenantInput) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }
  const parsed = addTenantSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || 'Check the tenant details.' }
  const data = parsed.data
  try {
    // Claim an existing empty unit atomically. A second request cannot replace its tenant.
    const result = await prisma.unit.updateMany({
      where: {
        id: data.unitId, propertyId: data.propertyId, property: { ownerId: session.user.id },
        status: 'VACANT', tenantId: null, OR: [{ tenantName: null }, { tenantName: '' }],
      },
      data: {
        status: 'OCCUPIED', tenantName: data.tenantName, tenantPhone: data.tenantPhone,
        rentStartDate: new Date(`${data.rentStartDate}T00:00:00Z`),
        rentEndDate: new Date(`${data.rentEndDate}T00:00:00Z`),
      },
    })
    if (result.count !== 1) return { success: false, error: 'This unit is unavailable. Choose a vacant unit already assigned in the Units tab.' }
    for (const path of ['/dashboard', '/dashboard/tenants', '/dashboard/properties', `/dashboard/properties/${data.propertyId}`, `/dashboard/properties/${data.propertyId}/manage`]) revalidatePath(path)
    return { success: true }
  } catch (error) {
    console.error('Failed to add tenant:', error)
    return { success: false, error: 'Could not save the tenant. Refresh to check the unit before trying again.' }
  }
}
