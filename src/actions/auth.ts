'use server'

import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { generateVerificationToken } from '@/lib/tokens'
import { sendVerificationEmail } from '@/lib/mail'
import { cookies } from 'next/headers'
import { TERMS_VERSION, TERMS_COOKIE_NAME } from '@/lib/terms'

const registrationRoleSchema = z.enum(['TENANT', 'OWNER', 'AGENT', 'VENDOR'])

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long.' }),
  confirmPassword: z.string(),
  // FIX: Changed LANDLORD to OWNER to match the frontend and database perfectly!
  role: registrationRoleSchema,
  termsAccepted: z.boolean().refine((value) => value, 'Please accept the Terms and Conditions to create an account.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
})

export async function registerUser(prevState: any, formData: FormData) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const role = formData.get('role') as string
    const termsAccepted = formData.get('termsAccepted') === 'accepted'

    const validatedFields = registerSchema.safeParse({ email, password, confirmPassword, role, termsAccepted })

    if (!validatedFields.success) {
      return { error: validatedFields.error.issues[0]?.message || 'Validation failed.', success: false }
    }

    const { email: validEmail, password: validPassword, role: validRole } = validatedFields.data

    const existingUser = await prisma.user.findUnique({ where: { email: validEmail } })

    if (existingUser && (existingUser.emailVerified || !existingUser.passwordHash || !await bcrypt.compare(validPassword, existingUser.passwordHash))) {
      return { error: 'An account with this email already exists.', success: false }
    }

    if (!existingUser) {
      const salt = await bcrypt.genSalt(10)
      const passwordHash = await bcrypt.hash(validPassword, salt)

      await prisma.user.create({
        data: {
          name: validEmail.split('@')[0],
          email: validEmail,
          passwordHash,
          role: validRole,
          termsAcceptedAt: new Date(),
          termsVersion: TERMS_VERSION,
        }
      })
    } else if (!existingUser.termsAcceptedAt || existingUser.termsVersion !== TERMS_VERSION) {
      await prisma.user.update({ where: { id: existingUser.id }, data: { termsAcceptedAt: new Date(), termsVersion: TERMS_VERSION } })
    }

    try {
      const verificationToken = await generateVerificationToken(validEmail)
      await sendVerificationEmail(verificationToken.identifier, verificationToken.token)
    } catch (error) {
      console.error('Verification email failed:', error)
      return { error: 'Your account is saved, but the verification email could not be sent. Please try again with the same email and password.', success: false }
    }

    return { success: true, error: null }

  } catch (error) {
    console.error('Registration Error:', error)
    return { error: 'Something went wrong. Please try again.', success: false }
  }
}

export async function prepareOAuthRegistration(role: string, termsAccepted: boolean) {
  const validRole = registrationRoleSchema.safeParse(role)
  if (!validRole.success || termsAccepted !== true) {
    return { success: false, error: 'Choose an account type and accept the Terms and Conditions to continue.' }
  }
  const cookieStore = await cookies()
  const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: 600 }
  cookieStore.set('impact_link_pending_role', validRole.data, options)
  cookieStore.set(TERMS_COOKIE_NAME, TERMS_VERSION, options)
  return { success: true }
}

export async function loginUser(prevState: any, formData: FormData) {
  try {
    // 1. Extract the credentials
    const rawIdentifier = (formData.get('email') as string).trim()
    const identifier = rawIdentifier.includes('@') ? rawIdentifier.toLowerCase() : rawIdentifier
    const password = formData.get('password') as string

    // 2. Fetch the user to check their role and KYC status
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    })

    // 3. Determine the dynamic destination
    let destination = '/dashboard' // Default destination for Tenants and fully onboarded users

    // If the user exists and hasn't completed KYC (isVerified === false)
    if (user && !user.isVerified) {
      // Check against 'OWNER' (Prisma Schema) and 'LANDLORD' (Frontend Fallback)
      if (user.role === 'OWNER' || (user.role as string) === 'LANDLORD') {
        destination = '/onboarding/landlord'
      } else if (user.role === 'AGENT') {
        destination = '/onboarding/agent'
      } else if (user.role === 'VENDOR') {
        destination = '/onboarding/vendor'
      }
    }

    // 4. Sign in AND Redirect (NextAuth v5 requires them in the SAME object)
    await signIn('credentials', {
      email: identifier,
      password: password,
      redirectTo: destination 
    })
    
  } catch (error: any) {
    if (error instanceof AuthError) {
      // Catch our custom unverified email error
      if (error.cause?.err?.message === 'unverified_email' || error.message.includes('unverified_email')) {
        return { error: 'unverified_email', success: false }
      }

      // --- FIX: Catch Auth.js v5 Invalid Credentials error ---
      if (
        error.type === 'CredentialsSignin' || 
        error.type === 'CallbackRouteError' || 
        error.cause?.err?.message === 'Invalid credentials'
      ) {
        return { error: 'Invalid email or password.', success: false }
      }

      return { error: 'Authentication failed. Please try again.', success: false }
    }
    // CRITICAL: Next.js redirects are actually thrown as errors!
    // This throw allows the redirect from signIn() to reach the browser.
    throw error 
  }
}

// --- Action to verify the token when the user clicks the email link ---
export async function verifyEmailToken(token: string) {
  try {
    const existingToken = await prisma.verificationToken.findUnique({
      where: { token }
    })

    if (!existingToken) return { error: "Token does not exist!" }

    const hasExpired = new Date(existingToken.expires) < new Date()
    if (hasExpired) return { error: "Token has expired!" }

    const existingUser = await prisma.user.findUnique({
      where: { email: existingToken.identifier }
    })

    if (!existingUser) return { error: "Email does not exist!" }

    // Update user to verified
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { 
        emailVerified: new Date(),
        email: existingToken.identifier 
      }
    })

    // Delete the token so it can't be used again
    await prisma.verificationToken.delete({
      where: { token: existingToken.token }
    })

    return { success: "Email verified!" }
  } catch (error) {
    return { error: "Something went wrong." }
  }
}

// --- Action to Resend the Verification Email ---
export async function resendVerificationEmail(email: string) {
  try {
    const input = z.string().trim().min(3).max(254).safeParse(email)
    if (!input.success) return { error: 'Enter the email address or phone number you registered with.' }
    const identifier = input.data.includes('@') ? input.data.toLowerCase() : input.data
    const user = await prisma.user.findFirst({ where: { OR: [{ email: identifier }, { phone: identifier }] } })
    
    if (!user) {
      return { error: "User not found." }
    }
    if (user.emailVerified) {
      return { error: "This email is already verified. Please log in." }
    }

    // Generate a fresh token and dispatch the email
    const verificationToken = await generateVerificationToken(user.email)
    await sendVerificationEmail(verificationToken.identifier, verificationToken.token)

    return { success: "A new verification link has been sent to your email!" }
  } catch (error) {
    console.error("Resend Email Error:", error)
    return { error: "Failed to send email. Please try again." }
  }
}
