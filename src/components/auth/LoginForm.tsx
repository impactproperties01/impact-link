'use client'

import { useState, useActionState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Mail, Lock, EyeOff, Eye, ArrowRight, Smartphone, MailWarning, Loader2 } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { loginUser, resendVerificationEmail } from '@/actions/auth'
import { authErrorMessage } from '@/lib/auth-errors'

export default function LoginForm({ oauthError }: { oauthError?: string } = {}) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  
  // State to hold the email they typed so we can pass it to the resend action
  const [emailValue, setEmailValue] = useState('') 

  const [state, formAction, isPending] = useActionState(loginUser, null)
  const [oauthPending, setOAuthPending] = useState(false)
  const [oauthStartError, setOAuthStartError] = useState('')
  const socialError = oauthStartError || authErrorMessage(oauthError)

  const handleGoogleSignIn = async () => {
    if (oauthPending || isPending) return
    setOAuthPending(true)
    setOAuthStartError('')
    try {
      await signIn('google', { redirectTo: '/dashboard' })
    } catch {
      setOAuthStartError('Could not connect to Google sign-in. Check your connection and try again.')
    } finally {
      setOAuthPending(false)
    }
  }
  
  // Resend Verification Email logic
  const [isResending, startResendTransition] = useTransition()
  const [resendStatus, setResendStatus] = useState<{success?: string, error?: string} | null>(null)

  const handleResend = () => {
    if (!emailValue) return
    startResendTransition(async () => {
      const result = await resendVerificationEmail(emailValue)
      setResendStatus(result)
    })
  }

  return (
    <div className="w-full min-h-screen bg-white md:bg-gray-50/40 flex flex-col items-center justify-start md:justify-center relative overflow-hidden">
      
      {/* Main Container Wrapper */}
      <div className="w-full max-w-md md:max-w-4xl bg-white md:rounded-[32px] md:shadow-[0_8px_32px_rgba(0,0,0,0.02)] md:border md:border-gray-100 flex flex-col md:flex-row overflow-hidden relative md:my-10">
        
        {/* --- MOBILE: Top Right Curved Image --- */}
        <div className="absolute top-0 right-0 w-[45%] h-[240px] z-0 md:hidden pointer-events-none">
          <div className="absolute top-0 right-6 w-full h-[180px] bg-[#e6f4ed] rounded-bl-[80px] rounded-tl-[40px] -z-10"></div>
          <div className="relative w-full h-[200px] overflow-hidden rounded-bl-[100px] rounded-tl-[20px]">
            <Image 
              src="/hero-image.png" 
              alt="Property" 
              fill 
              className="object-cover object-left"
              unoptimized
            />
          </div>
        </div>

        {/* --- LEFT COLUMN: Form & Content --- */}
        <div className="w-full md:w-[55%] pt-16 md:pt-14 px-6 md:px-12 pb-8 flex flex-col relative z-10">
          
          {/* Back Button */}
          <button 
            type="button"
            onClick={() => router.back()}
            className="absolute top-6 left-5 md:top-10 md:left-10 z-50 p-2 -ml-2 text-brand-dark hover:bg-gray-50 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Heading & Text */}
          <div className="mb-6 mt-2 md:mt-4 text-left">
            <Image 
              src="/logo.png" 
              alt="Impact Link" 
              width={130} 
              height={28} 
              className="mb-8"
              priority 
            />
            
            <div className="max-w-[62%] md:max-w-full">
              <h1 className="text-[28px] md:text-[32px] font-extrabold text-brand-dark leading-tight tracking-tight mb-2">
                Sign In
              </h1>
              <p className="text-[13.5px] md:text-[14.5px] text-gray-500 font-medium leading-relaxed">
                Welcome back. Sign in to your Impact Link account.
              </p>
            </div>
          </div>

          {/* --- DYNAMIC ERROR MESSAGES --- */}
          {socialError && <div role="alert" className="mb-5 p-4 bg-red-50 border border-red-100 text-red-700 text-[13px] font-medium rounded-[14px]">{socialError}</div>}
          {state?.error === 'unverified_email' ? (
            <div className="mb-5 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-[14px]">
              <div className="flex items-start gap-3 mb-2">
                <MailWarning className="w-5 h-5 shrink-0 text-amber-600" />
                <p className="text-[13px] font-bold mt-0.5">Please verify your email to log in.</p>
              </div>
              
              {resendStatus?.success ? (
                <p className="text-[12px] font-medium text-brand-emerald ml-8 bg-white p-2 rounded-lg border border-[#d2ede0]">
                  {resendStatus.success}
                </p>
              ) : (
                <button 
                  onClick={handleResend}
                  disabled={isResending}
                  className="ml-8 text-[12px] font-bold text-amber-900 underline hover:text-amber-700 transition-colors disabled:opacity-50"
                >
                  {isResending ? 'Sending...' : 'Click here to resend the link'}
                </button>
              )}
              {resendStatus?.error && <p className="text-[12px] text-red-600 ml-8 mt-1">{resendStatus.error}</p>}
            </div>
          ) : state?.error ? (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-100 text-red-600 text-[13px] font-medium rounded-xl">
              {state.error}
            </div>
          ) : null}

          {/* Form */}
          <form action={formAction} className="space-y-4">
            {/* Email / Phone */}
            <div>
              <label className="block text-[13px] font-bold text-[#111C15] mb-2 pl-1 text-left">
                Email or Phone Number
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  name="email" 
                  required 
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  placeholder="Enter your email or phone number" 
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-[14px] text-[13px] focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/20 transition-all text-brand-dark placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] font-bold text-[#111C15] mb-2 pl-1 text-left">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 w-5 h-5 text-gray-400" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  required 
                  placeholder="Enter your password" 
                  className="w-full pl-11 pr-12 py-3.5 bg-white border border-gray-200 rounded-[14px] text-[13px] focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/20 transition-all text-brand-dark placeholder:text-gray-400"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 p-1 rounded hover:bg-gray-50 text-gray-400 transition-colors"
                >
                  {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <Link href="/forgot-password" className="text-[12.5px] font-bold text-brand-forest hover:text-brand-dark transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isPending || oauthPending}
              className="w-full mt-2 bg-brand-forest hover:bg-brand-dark text-white py-4 rounded-[14px] text-[14px] font-bold flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>Signing In <Loader2 className="w-4 h-4 animate-spin" /></>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6 md:my-7">
            <div className="flex-1 border-t border-gray-100"></div>
            <span className="px-3 text-[11px] text-gray-400 font-bold">OR</span>
            <div className="flex-1 border-t border-gray-100"></div>
          </div>

          {/* Social Logins */}
          <div className="space-y-3">
            <button 
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isPending || oauthPending}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-gray-100 hover:bg-gray-50 rounded-[14px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Image src="https://authjs.dev/img/providers/google.svg" alt="Google" width={20} height={20} />
              <span className="text-[13px] font-bold text-brand-dark">{oauthPending ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>
            <button 
              type="button"
              onClick={() => signIn('apple', { callbackUrl: '/dashboard' })}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-gray-100 hover:bg-gray-50 rounded-[14px] transition-colors"
            >
              <Image src="https://authjs.dev/img/providers/apple.svg" alt="Apple" width={20} height={20} className="dark:invert" />
              <span className="text-[13px] font-bold text-brand-dark">Continue with Apple</span>
            </button>
            <button 
              type="button"
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-gray-100 hover:bg-gray-50 rounded-[14px] transition-colors"
            >
              <Smartphone className="w-5 h-5 text-gray-700" />
              <span className="text-[13px] font-bold text-brand-dark">Continue with Phone Number</span>
            </button>
          </div>

          <p className="text-center text-[13.5px] text-gray-500 font-medium mt-8 mb-2">
            Don&apos;t have an account? <Link href="/register" className="text-brand-forest font-bold hover:text-brand-dark transition-colors ml-1">Sign Up</Link>
          </p>

        </div>

        {/* --- RIGHT COLUMN: Desktop Image Panel --- */}
        <div className="hidden md:block w-[45%] relative bg-gray-50 p-3">
          <div className="relative w-full h-full rounded-[24px] overflow-hidden">
            <Image 
              src="/hero-image.png" 
              alt="Property" 
              fill 
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A252A]/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-10 left-10 right-10 text-white">
              <h3 className="text-2xl font-bold mb-2 leading-tight">Find your perfect home.</h3>
              <p className="text-[14px] text-white/90">Sign in to access your dashboard, view tenant requests, and track your listings.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
