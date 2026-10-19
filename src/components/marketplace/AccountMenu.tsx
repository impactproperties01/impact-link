'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { User, LogIn, UserPlus, LayoutDashboard, LogOut } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

type AccountMenuProps = { variant?: 'header' | 'sidebar' | 'bottom' }

export default function AccountMenu({ variant = 'header' }: AccountMenuProps) {
  const { data: session, status } = useSession()
  const details = useRef<HTMLDetailsElement>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState('')
  const user = session?.user

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (details.current && !details.current.contains(event.target as Node)) details.current.open = false
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && details.current?.open) {
        details.current.open = false
        details.current.querySelector('summary')?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    setError('')
    try {
      await signOut({ callbackUrl: '/' })
    } catch {
      setError('Could not sign out. Please try again.')
    } finally {
      setSigningOut(false)
    }
  }

  const summaryClass = variant === 'sidebar'
    ? 'flex items-center gap-4 rounded-xl px-4 py-3 font-medium text-gray-500 hover:bg-gray-50 hover:text-brand-dark'
    : variant === 'bottom'
      ? 'flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600'
      : 'flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-500 hover:bg-gray-200'
  const positionClass = variant === 'bottom'
    ? 'bottom-full right-0 mb-2'
    : variant === 'sidebar'
      ? 'left-0 top-full mt-2'
      : 'right-0 top-full mt-2'
  const linkClass = 'flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-dark hover:bg-gray-50'
  function close() {
    if (details.current) details.current.open = false
  }

  return (
    <details ref={details} name="marketplace-account" className={`relative ${variant === 'header' ? '' : 'w-full'}`}>
      <summary aria-label="Profile and account" className={`cursor-pointer list-none [&::-webkit-details-marker]:hidden ${summaryClass}`}>
        <User className="h-5 w-5" aria-hidden="true" />
        {variant !== 'header' && <span>Profile</span>}
      </summary>
      <div className={`absolute z-[60] w-56 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl ${positionClass}`}>
        {status === 'loading' ? (
          <p className="px-3 py-2 text-sm text-gray-500" role="status">Loading account…</p>
        ) : user ? (
          <>
            <p className="truncate border-b border-gray-100 px-3 py-3 text-sm font-semibold text-brand-dark">{user.name || 'Your account'}</p>
            <Link href="/dashboard" onClick={close} className={linkClass}><LayoutDashboard className="h-4 w-4" aria-hidden="true" />Dashboard</Link>
            <button type="button" disabled={signingOut} onClick={handleSignOut} className={`${linkClass} text-red-600 disabled:opacity-50`}><LogOut className="h-4 w-4" aria-hidden="true" />{signingOut ? 'Signing out…' : 'Sign out'}</button>
            {error && <p role="alert" className="px-3 py-2 text-xs text-red-600">{error}</p>}
          </>
        ) : (
          <>
            <Link href="/login" onClick={close} className={linkClass}><LogIn className="h-4 w-4" aria-hidden="true" />Sign in</Link>
            <Link href="/register" onClick={close} className={linkClass}><UserPlus className="h-4 w-4" aria-hidden="true" />Sign up</Link>
          </>
        )}
      </div>
    </details>
  )
}
