'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getDashboardDates } from '@/lib/dashboard-metrics'
import { extendRentDate, getRentExtensionMonths, rentPaymentSchema, type RentPaymentInput } from '@/lib/rent-payments'

export async function recordTenantPaymentAction(unitId: string, propertyId: string, input: RentPaymentInput) {
  const session = await auth()
  if (!session?.user?.id) return { success: false, error: 'Unauthorized' }
  const parsed = rentPaymentSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Enter a valid amount, payment date and rent period.' }
  const data = parsed.data
  const now = new Date()
  const datePaid = new Date(`${data.datePaid}T00:00:00+01:00`)
  const calendarDate = new Date(`${data.datePaid}T00:00:00Z`)
  if (!Number.isFinite(datePaid.getTime()) || calendarDate.toISOString().slice(0, 10) !== data.datePaid || datePaid >= getDashboardDates(now).tomorrow) {
    return { success: false, error: 'Payment date must be a valid date, today or earlier.' }
  }
  const ownerId = session.user.id
  const recordedRequest = { requestId: data.requestId, unitId, unit: { propertyId, property: { ownerId } } }
  const refresh = () => {
    for (const path of ['/dashboard', '/dashboard/payments', '/dashboard/tenants', '/dashboard/properties', `/dashboard/properties/${propertyId}`, `/dashboard/properties/${propertyId}/manage`]) revalidatePath(path)
  }

  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await prisma.$transaction(async (tx) => {
          // A retry after a lost response returns the original success.
          if (await tx.payment.findFirst({ where: recordedRequest, select: { id: true } })) return
          const unit = await tx.unit.findFirst({
            where: { id: unitId, propertyId, property: { ownerId } },
            include: { property: { select: { tenancyDuration: true } } },
          })
          if (!unit) throw new Error('Property or unit not found.')
          if (unit.status !== 'OCCUPIED' || !unit.tenantName?.trim()) throw new Error('Assign a tenant before recording rent.')
          if ((unit.rentEndDate?.toISOString() ?? null) !== data.expectedRentEndDate) throw new Error('The rent period changed. Refresh the page before recording this payment.')

          const periodStart = unit.rentEndDate ?? datePaid
          const periodEnd = extendRentDate(periodStart, getRentExtensionMonths(unit.property.tenancyDuration))
          const changed = await tx.unit.updateMany({
            where: { id: unitId, propertyId, updatedAt: unit.updatedAt, property: { ownerId } },
            data: { ...(data.extendRent ? { rentEndDate: periodEnd } : {}), updatedAt: now },
          })
          if (changed.count !== 1) throw new Error('The unit changed. Refresh the page before recording this payment.')
          await tx.payment.create({ data: {
            unitId, tenantName: unit.tenantName, unitName: unit.name, requestId: data.requestId,
            amount: data.amount, datePaid, dueDate: data.extendRent ? periodStart : datePaid, status: 'PAID',
          } })
        }, { isolationLevel: 'Serializable' })
        refresh()
        return { success: true }
      } catch (error) {
        const code = (error as { code?: string }).code
        if (code === 'P2034' && attempt < 2) continue
        if (code === 'P2002' && await prisma.payment.findFirst({ where: recordedRequest, select: { id: true } })) {
          refresh()
          return { success: true }
        }
        throw error
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (['Property or unit not found.', 'Assign a tenant before recording rent.', 'The rent period changed. Refresh the page before recording this payment.', 'The unit changed. Refresh the page before recording this payment.'].includes(message)) {
      return { success: false, error: message }
    }
    console.error('Failed to record payment:', error)
    return { success: false, retrySameRequest: true, error: 'Unable to confirm the payment. Retry this form to check and save it safely.' }
  }
  return { success: false, retrySameRequest: true, error: 'Unable to confirm the payment. Please retry this form.' }
}
