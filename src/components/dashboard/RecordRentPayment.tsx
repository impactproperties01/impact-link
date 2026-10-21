'use client'

import { useRef, useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { recordTenantPaymentAction } from '@/actions/payments'
import { getRentExtensionMonths, type RentPaymentInput } from '@/lib/rent-payments'
import { formatNaira, formatUnitName } from '@/lib/property-display'

type PaymentUnit = { id: string; name: string; price: number; tenantName: string | null; rentEndDate: Date | string | null }

export default function RecordRentPayment({ unit, propertyId, tenancyDuration, onClose }: {
  unit: PaymentUnit; propertyId: string; tenancyDuration: string | null; onClose: () => void
}) {
  const router = useRouter()
  const submitting = useRef(false)
  const submittedInput = useRef<RentPaymentInput | null>(null)
  const [isPending, startTransition] = useTransition()
  const [amount, setAmount] = useState(String(unit.price))
  const [datePaid, setDatePaid] = useState(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()))
  const [extendRent, setExtendRent] = useState(true)
  const [error, setError] = useState('')
  const [locked, setLocked] = useState(false)

  const savePayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current) return
    submitting.current = true
    setError('')
    submittedInput.current ??= {
      requestId: crypto.randomUUID(), amount: Number(amount), datePaid, extendRent,
      expectedRentEndDate: unit.rentEndDate ? new Date(unit.rentEndDate).toISOString() : null,
    }
    setLocked(true)
    startTransition(async () => {
      try {
        const res = await recordTenantPaymentAction(unit.id, propertyId, submittedInput.current!)
        if (res.success) {
          router.refresh()
          onClose()
        } else {
          setError(res.error || 'Failed to record payment.')
          // A confirmed failure can be corrected and submitted as a new request.
          if (!('retrySameRequest' in res && res.retrySameRequest)) {
            submittedInput.current = null
            setLocked(false)
          }
        }
      } catch {
        // Preserve the same payload and request ID if the response was lost.
        setError('Unable to confirm the payment. Retry this form to check and save it safely.')
      } finally {
        submitting.current = false
      }
    })
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <form onSubmit={savePayment} role="dialog" aria-modal="true" aria-labelledby="record-payment-title" className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between gap-3"><h3 id="record-payment-title" className="text-lg font-extrabold text-brand-dark">Record rent payment</h3><button type="button" disabled={isPending} onClick={onClose} aria-label="Close payment form"><X className="h-5 w-5" /></button></div>
        <p className="text-sm text-gray-500">{unit.tenantName} · {formatUnitName(unit.name)}</p>
        <label className="block text-sm font-semibold">Amount received (₦)<input required type="number" min="0.01" max="1000000000000" step="0.01" value={amount} disabled={locked} onChange={(event) => setAmount(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 p-3" /></label>
        <label className="block text-sm font-semibold">Date received<input required type="date" value={datePaid} disabled={locked} onChange={(event) => setDatePaid(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 p-3" /></label>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={extendRent} disabled={locked} onChange={(event) => setExtendRent(event.target.checked)} className="mt-1" /><span>Extend the rent period by {getRentExtensionMonths(tenancyDuration)} months.<span className="mt-1 block text-xs text-gray-500">Turn this off if the rent dates were already extended for this payment.</span></span></label>
        <p className="text-xs text-gray-500">{formatNaira(Number(amount) || 0)} will be saved to payment history and included in rent collected for the year received.</p>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={isPending} className="w-full rounded-xl bg-brand-forest p-3 text-sm font-bold text-white disabled:opacity-50">{isPending ? 'Saving...' : 'Save payment'}</button>
      </form>
    </div>
  )
}
