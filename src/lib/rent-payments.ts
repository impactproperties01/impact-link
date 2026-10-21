import { z } from 'zod'

export const rentPaymentSchema = z.object({
  requestId: z.string().uuid(),
  amount: z.number().finite().positive().max(1e12).refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.01, 'Use at most two decimal places.'),
  datePaid: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  extendRent: z.boolean(),
  expectedRentEndDate: z.iso.datetime().nullable(),
})

export type RentPaymentInput = z.infer<typeof rentPaymentSchema>

export function getRentExtensionMonths(duration: string | null | undefined) {
  const value = duration?.toLowerCase().trim() || ''
  if (['monthly', 'month', '1 month'].includes(value)) return 1
  if (value.includes('6') || value.includes('bi')) return 6
  return 12
}

// Clamp month-end dates (e.g. 31 August + 6 months -> 28 February).
export function extendRentDate(start: Date, months: number) {
  const end = new Date(start)
  const day = end.getUTCDate()
  end.setUTCDate(1)
  end.setUTCMonth(end.getUTCMonth() + months)
  const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate()
  end.setUTCDate(Math.min(day, lastDay))
  return end
}
