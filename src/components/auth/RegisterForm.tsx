'use client'

import { useActionState, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { registerUser, prepareOAuthRegistration } from '@/actions/auth'
import { Mail, Lock, ArrowRight, UserCheck, ChevronLeft, Eye, EyeOff, Send } from 'lucide-react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

const ROLE_DISPLAY = {
  TENANT: 'Tenant / Buyer',
  OWNER: 'Property Owner',
  AGENT: 'Real Estate Agent',
  VENDOR: 'Property Professional'
}

export default function RegisterForm({ 
  defaultRole = 'TENANT',
  onBack 
}: { 
  defaultRole?: string
  onBack: () => void 
}) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(registerUser, null)
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [oauthPending, setOAuthPending] = useState(false)
  const [termsError, setTermsError] = useState('')

  const handleOAuthSignUp = async (provider: 'google' | 'apple') => {
    if (!termsAccepted) {
      setTermsError('Please accept the Terms and Conditions to continue.')
      return
    }
    setOAuthPending(true)
    try {
      const result = await prepareOAuthRegistration(defaultRole, termsAccepted)
      if (!result.success) {
        setTermsError(result.error || 'Could not start signup. Please try again.')
        setOAuthPending(false)
        return
      }
      await signIn(provider, { callbackUrl: '/dashboard' })
    } catch {
      setTermsError('Could not start signup. Please try again.')
      setOAuthPending(false)
    }
  }

  // --- Check Your Email Screen ---
  if (state?.success) {
    return (
      <div className="w-full min-h-screen bg-white flex flex-col items-center justify-start pb-4 md:pb-8 relative">
        <div className="absolute top-0 left-4 md:top-8 md:left-8 z-50">
          <Image src="/logo.png" alt="Impact Link" width={130} height={28} className="md:w-[150px] md:h-auto mt-2 md:mt-0" priority />
        </div>
        <div className="w-full max-w-md bg-white md:rounded-[32px] md:shadow-[0_8px_32px_rgba(0,0,0,0.02)] md:border md:border-gray-100 md:mt-32 mt-24 p-8 md:p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-[#e6f4ed] rounded-full flex items-center justify-center mb-6">
            <Send className="w-8 h-8 text-brand-emerald ml-1" />
          </div>
          <h2 className="text-2xl font-extrabold text-brand-dark mb-3 tracking-tight">Check your email</h2>
          <p className="text-[14px] text-gray-500 font-medium mb-8 leading-relaxed">
            We've sent a secure verification link to your email address. Please click the link to activate your account.
          </p>
          <Link 
            href="/login"
            className="w-full bg-gray-50 border border-gray-200 text-brand-dark hover:bg-gray-100 py-3.5 rounded-xl text-[13px] font-bold transition-colors shadow-sm flex items-center justify-center"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-white flex flex-col items-center justify-start pb-4 md:pb-8 relative">
      
      {/* Logo */}
      <div className="absolute top-0 left-4 md:top-8 md:left-8 z-50">
        <Image 
          src="/logo.png" 
          alt="Impact Link" 
          width={130} 
          height={28} 
          className="md:w-[150px] md:h-auto mt-2 md:mt-0" 
          priority 
        />
      </div>

      {/* Main Content Wrapper */}
      <div className="w-full max-w-md md:max-w-4xl bg-white md:rounded-[32px] md:shadow-[0_8px_32px_rgba(0,0,0,0.02)] md:border md:border-gray-100 md:mt-24 mb-4 flex flex-col overflow-hidden relative">
        
        {/* Step 2 Header Info & Hero Image */}
        <div className="relative pt-16 px-6 md:pt-8 md:px-12 mb-1 flex justify-between items-start w-full">
          <div className="relative z-10 max-w-[62%] md:max-w-[50%] mt-2 md:mt-0">
            <button 
              onClick={onBack}
              className="flex items-center gap-1 text-[11.5px] font-bold text-gray-400 hover:text-brand-dark transition-colors mb-3 md:mb-4 -ml-1"
            >
              <ChevronLeft className="w-4 h-4" /> Back to selection
            </button>
            <h1 className="text-[26px] md:text-[34px] font-extrabold text-brand-dark leading-[1.12] tracking-tight mb-1.5">
              Create an<br className="md:hidden"/> <span className="text-brand-forest">Account</span>
            </h1>
            <p className="text-[13px] md:text-[14.5px] text-gray-500 font-medium">
              Join Impact Link to secure your properties.
            </p>
          </div>

          <div className="absolute top-0 right-[-32px] md:right-0 w-[55%] md:w-[45%] h-[160px] md:h-[180px] z-0 overflow-hidden md:relative md:overflow-visible">
            <div className="relative w-full h-full [mask-image:linear-gradient(to_right,transparent_0%,black_35%,black_100%)] -webkit-[mask-image:linear-gradient(to_right,transparent_0%,black_35%,black_100%)]">
              <Image 
                src="/hero-image.png" 
                alt="Architecture" 
                fill 
                className="object-cover object-right md:object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>

        {/* Status Messages */}
        <div className="px-6 md:px-12 relative z-10 mt-2">
          {state?.error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-100 text-red-600 text-[13px] font-medium rounded-xl">
              {state.error}
            </div>
          )}
        </div>

        {/* 2-Column Desktop Layout / Stacked Mobile Layout */}
        <div className="px-6 md:px-12 flex-1 flex flex-col md:flex-row gap-6 md:gap-12 relative z-10 mt-1 md:mt-2 pb-8">
          
          {/* LEFT: The Form Fields */}
          <div className="w-full md:w-[55%]">
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="role" value={defaultRole} />

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 pl-1">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-gray-400" />
                  <input 
                    type="email" 
                    name="email" 
                    required 
                    placeholder="name@example.com" 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/20 transition-all text-brand-dark placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 pl-1">Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-gray-400" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    required 
                    placeholder="••••••••" 
                    minLength={6}
                    className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/20 transition-all text-brand-dark placeholder:text-gray-400"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 p-1 text-gray-400 hover:text-brand-dark transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 pl-1">Confirm Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-gray-400" />
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    name="confirmPassword" 
                    required 
                    placeholder="••••••••" 
                    minLength={6}
                    className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/20 transition-all text-brand-dark placeholder:text-gray-400"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 p-1 text-gray-400 hover:text-brand-dark transition-colors focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <input id="signupTerms" type="checkbox" name="termsAccepted" value="accepted" checked={termsAccepted} required disabled={isPending || oauthPending} onChange={(event) => { setTermsAccepted(event.target.checked); setTermsError('') }} aria-describedby={termsError ? 'signupTermsError' : undefined} className="mt-0.5 h-5 w-5 shrink-0 accent-brand-forest" />
                  <label htmlFor="signupTerms" className="text-[12px] leading-relaxed text-gray-600">I have read and accept the <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-forest underline underline-offset-2">Terms and Conditions</Link>.</label>
                </div>
                {termsError && <p id="signupTermsError" role="alert" className="text-xs text-red-600">{termsError}</p>}
              </div>

              <button 
                type="submit" 
                disabled={isPending || oauthPending || !termsAccepted}
                className="w-full mt-2 bg-brand-forest hover:bg-brand-dark text-white py-3.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isPending ? 'Creating account...' : 'Sign Up'} 
                {!isPending && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </div>

          {/* RIGHT: Selected Role & OAuth */}
          <div className="w-full md:w-[45%] flex flex-col md:border-l md:border-gray-100 md:pl-12">
            
            <div className="mb-6 flex items-center p-3.5 bg-[#F4FAF7] border border-[#d2ede0] rounded-xl">
              <div className="p-2 bg-white rounded-[10px] shadow-sm border border-gray-100 mr-3">
                <UserCheck className="w-5 h-5 text-brand-emerald" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-brand-forest/70 uppercase tracking-wider mb-0.5">Signing up as</p>
                <p className="text-[13px] font-bold text-brand-dark leading-none">
                  {ROLE_DISPLAY[defaultRole as keyof typeof ROLE_DISPLAY] || 'User'}
                </p>
              </div>
            </div>

            <div className="flex items-center mb-6 md:hidden">
              <div className="flex-1 border-t border-gray-100"></div>
              <span className="px-3 text-[11px] text-gray-400 font-bold">OR</span>
              <div className="flex-1 border-t border-gray-100"></div>
            </div>

            <div className="space-y-3">
              <button 
                type="button"
                onClick={() => handleOAuthSignUp('google')}
                disabled={isPending || oauthPending || !termsAccepted}
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Image src="https://authjs.dev/img/providers/google.svg" alt="Google" width={20} height={20} />
                <span className="text-[13px] font-bold text-brand-dark">Continue with Google</span>
              </button>
              <button 
                type="button"
                onClick={() => handleOAuthSignUp('apple')}
                disabled={isPending || oauthPending || !termsAccepted}
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Image src="https://authjs.dev/img/providers/apple.svg" alt="Apple" width={20} height={20} className="dark:invert" />
                <span className="text-[13px] font-bold text-brand-dark">Continue with Apple</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
