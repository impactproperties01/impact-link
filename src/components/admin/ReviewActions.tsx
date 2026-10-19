'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { reviewListing } from '@/actions/admin-listings'

type Decision = 'APPROVE' | 'REJECT'

export default function ReviewActions({ propertyId }: { propertyId: string }) {
  const router = useRouter()
  const [decision, setDecision] = useState<Decision | null>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const confirmDecision = () => {
    if (!decision || isPending) return
    setError('')
    startTransition(async () => {
      try {
        const result = await reviewListing(propertyId, decision)
        if (!result.success) {
          setError(result.error || 'Could not save the decision.')
          return
        }
        router.refresh()
      } catch {
        setError('Could not save the decision. Please try again.')
      }
    })
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-brand-dark">Review decision</h2>
        <p className="text-sm text-gray-500 mt-1">Approve this listing to publish it, or reject it to keep it off the marketplace.</p>
      </div>
      {decision ? (
        <div className={`rounded-xl border p-4 space-y-3 ${decision === 'APPROVE' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
          <p className="text-sm font-semibold text-brand-dark">
            {decision === 'APPROVE' ? 'Publish this listing?' : 'Reject this listing?'}
          </p>
          <p className="text-sm text-gray-600">{decision === 'APPROVE' ? 'It will be eligible to appear in public property listings.' : 'The owner will see Rejected with a Contact link.'}</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={confirmDecision} disabled={isPending} className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 flex items-center gap-2 ${decision === 'APPROVE' ? 'bg-brand-forest hover:bg-brand-dark' : 'bg-red-600 hover:bg-red-700'}`}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? 'Saving...' : decision === 'APPROVE' ? 'Confirm approval' : 'Confirm rejection'}
            </button>
            <button type="button" onClick={() => { setDecision(null); setError('') }} disabled={isPending} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold disabled:opacity-50">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setDecision('APPROVE')} className="flex items-center gap-2 rounded-xl bg-brand-forest px-5 py-3 text-sm font-bold text-white hover:bg-brand-dark"><CheckCircle2 className="h-4 w-4" /> Approve listing</button>
          <button type="button" onClick={() => setDecision('REJECT')} className="flex items-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50"><XCircle className="h-4 w-4" /> Reject listing</button>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </section>
  )
}
