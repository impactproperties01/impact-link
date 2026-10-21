import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { getDashboardDates, getPortfolioOccupancy, type DashboardPaymentRecord } from '@/lib/dashboard-metrics'

function paymentScope(ownerId: string, propertyId?: string) {
  const property = { ownerId, ...(propertyId ? { id: propertyId } : {}) }
  return { OR: [{ lease: { property } }, { unit: { property } }] }
}

const paymentContextSelect = {
  tenantName: true, unitName: true,
  lease: { select: {
    tenant: { select: { name: true, email: true } },
    property: { select: { id: true, address: true } },
  } },
  unit: { select: {
    name: true, tenantName: true,
    property: { select: { id: true, address: true } },
  } },
} satisfies Prisma.PaymentSelect

function paymentContext(payment: Prisma.PaymentGetPayload<{ select: typeof paymentContextSelect }>) {
  const property = payment.unit?.property ?? payment.lease?.property
  if (!property) throw new Error('Payment has no associated property.')
  return {
    property,
    tenantName: payment.tenantName || payment.lease?.tenant.name || payment.lease?.tenant.email || payment.unit?.tenantName || 'Tenant not specified',
    unitName: payment.unitName || payment.unit?.name || null,
  }
}

export async function getOwnerPaymentSummary(ownerId: string, now = new Date(), propertyId?: string) {
  if (!ownerId) throw new Error('A user is required to load payment data.')
  const dates = getDashboardDates(now)
  const scope = paymentScope(ownerId, propertyId)
  const [collected, outstanding] = await Promise.all([
    prisma.payment.aggregate({ where: { ...scope, status: 'PAID', datePaid: { gte: dates.yearStart, lte: now } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { ...scope, status: { in: ['PENDING', 'OVERDUE'] }, dueDate: { lt: dates.tomorrow } }, _sum: { amount: true } }),
  ])
  return { rentCollected: collected._sum.amount ?? 0, outstanding: outstanding._sum.amount ?? 0, dates }
}

export async function getDashboardData(ownerId: string, now = new Date()) {
  if (!ownerId) throw new Error('A user is required to load dashboard data.')
  const dates = getDashboardDates(now)
  const unpaid = { status: { in: ['PENDING', 'OVERDUE'] as ('PENDING' | 'OVERDUE')[] }, ...paymentScope(ownerId) }
  const [properties, inventory, financials, rentDue, renewals] = await Promise.all([
    prisma.property.findMany({
      where: { ownerId }, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], take: 5,
      select: {
        id: true, listingType: true, propertyType: true, address: true, basePrice: true,
        bedrooms: true, bathrooms: true, bedroomTypes: true, shortletBedrooms: true,
        size: true, images: true, status: true, tenancyDuration: true, unitPrices: true,
        totalUnits: true, availableUnits: true, units: { select: { status: true } },
      },
    }),
    prisma.property.findMany({ where: { ownerId }, select: {
      listingType: true, propertyType: true, totalUnits: true, availableUnits: true,
      units: { select: { status: true } },
    } }),
    getOwnerPaymentSummary(ownerId, now),
    prisma.payment.findMany({
      where: { ...unpaid, dueDate: { lt: dates.upcomingEnd } },
      orderBy: [{ dueDate: 'asc' }, { id: 'asc' }], take: 5,
      select: { id: true, amount: true, dueDate: true, ...paymentContextSelect },
    }),
    prisma.unit.findMany({
      where: { property: { ownerId }, status: 'OCCUPIED', rentEndDate: { lt: dates.upcomingEnd } },
      orderBy: [{ rentEndDate: 'asc' }, { id: 'asc' }], take: 5,
      select: { id: true, name: true, price: true, tenantName: true, rentEndDate: true, property: { select: { id: true, address: true } } },
    }),
  ])
  return {
    properties, propertyCount: inventory.length, occupancy: getPortfolioOccupancy(inventory),
    rentCollected: financials.rentCollected, outstanding: financials.outstanding,
    rentDue: rentDue.map((payment) => ({ id: payment.id, amount: payment.amount, dueDate: payment.dueDate, ...paymentContext(payment) })), renewals, dates,
  }
}

export async function getOwnerPayments(ownerId: string, requestedPage = 1, now = new Date(), propertyId?: string) {
  if (!ownerId) throw new Error('A user is required to load payment data.')
  const where = paymentScope(ownerId, propertyId)
  const [totalPayments, summary] = await Promise.all([prisma.payment.count({ where }), getOwnerPaymentSummary(ownerId, now, propertyId)])
  const totalPages = Math.max(1, Math.ceil(totalPayments / 50))
  const page = Math.min(totalPages, Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1)
  const payments = await prisma.payment.findMany({
    where, orderBy: [{ dueDate: 'desc' }, { id: 'asc' }], take: 50, skip: (page - 1) * 50,
    select: { id: true, amount: true, dueDate: true, datePaid: true, status: true, receiptUrl: true, ...paymentContextSelect },
  })
  const rows = payments.map((payment): DashboardPaymentRecord => {
    const context = paymentContext(payment)
    let receiptUrl: string | null = null
    try {
      const url = payment.receiptUrl ? new URL(payment.receiptUrl) : null
      if (url && ['https:', 'http:'].includes(url.protocol)) receiptUrl = url.toString()
    } catch { /* Invalid receipt URLs have no download link. */ }
    return {
      id: payment.id, amount: payment.amount, dueDate: payment.dueDate.toISOString(), datePaid: payment.datePaid?.toISOString() ?? null,
      status: payment.status === 'PAID' ? 'Paid' : payment.dueDate < summary.dates.today ? 'Overdue' : payment.dueDate < summary.dates.tomorrow ? 'Due today' : 'Pending',
      tenantName: context.tenantName, unitName: context.unitName,
      propertyId: context.property.id, propertyAddress: context.property.address || 'Address not recorded', receiptUrl,
    }
  })
  return { payments: rows, summary: { rentCollected: summary.rentCollected, outstanding: summary.outstanding, year: summary.dates.year }, totalPayments, totalPages, page }
}
