'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { verifyEmailToken } from '@/actions/auth'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

function VerifyContent() {
  const [error, setError] = useState<string | undefined>()
  const [success, setSuccess] = useState<string | undefined>()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (success || error) return
    if (!token) {
      setError("Missing token!")
      return
    }

    verifyEmailToken(token)
      .then((data) => {
        if (data?.error) setError(data.error)
        if (data?.success) setSuccess(data.success)
      })
      .catch(() => setError("Something went wrong."))
  }, [token, success, error])

  return (
    <div className="w-full max-w-md mx-auto bg-white p-8 md:p-10 rounded-[24px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center">
      <div className="flex justify-center mb-6">
        <Image src="/logo.png" alt="Impact Link" width={130} height={28} priority />
      </div>

      <h2 className="text-2xl font-extrabold text-brand-dark tracking-tight mb-6">
        Verifying Email
      </h2>

      {!success && !error && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-brand-emerald animate-spin" />
          <p className="text-gray-500 text-[14px] font-medium">Verifying your secure token...</p>
        </div>
      )}

      {success && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-brand-forest" />
          <p className="text-brand-forest font-bold">{success}</p>
          <p className="text-gray-500 text-[13px] mb-4">Your account is now fully verified.</p>
          <Link 
            href="/login"
            className="w-full bg-brand-forest hover:bg-brand-dark text-white py-3.5 rounded-xl text-[13px] font-bold transition-colors shadow-sm inline-block"
          >
            Go to Login
          </Link>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <XCircle className="w-12 h-12 text-red-500" />
          <p className="text-red-600 font-bold">{error}</p>
          <Link 
            href="/login"
            className="w-full mt-4 bg-gray-50 border border-gray-200 text-brand-dark hover:bg-gray-100 py-3.5 rounded-xl text-[13px] font-bold transition-colors inline-block"
          >
            Back to Login
          </Link>
        </div>
      )}
    </div>
  )
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-gray-50/40 flex items-center justify-center p-4">
      {/* Suspense is required by Next.js when using useSearchParams inside a client component */}
      <Suspense fallback={<div className="animate-pulse bg-white w-[400px] h-[300px] rounded-[24px]"></div>}>
        <VerifyContent />
      </Suspense>
    </div>
  )
}