'use server'

import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { generateVerificationToken } from '@/lib/tokens'
import { sendVerificationEmail } from '@/lib/mail'

const registerSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long.' }),
  confirmPassword: z.string(),
  // FIX: Changed LANDLORD to OWNER to match the frontend and database perfectly!
  role: z.enum(['TENANT', 'OWNER', 'AGENT', 'VENDOR']) 
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

    const validatedFields = registerSchema.safeParse({ email, password, confirmPassword, role })

    if (!validatedFields.success) {
      return { error: validatedFields.error.issues[0]?.message || 'Validation failed.', success: false }
    }

    const { email: validEmail, password: validPassword, role: validRole } = validatedFields.data

    const existingUser = await prisma.user.findUnique({ where: { email: validEmail } })

    if (existingUser) {
      return { error: 'An account with this email already exists.', success: false }
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(validPassword, salt)

    await prisma.user.create({
      data: {
        name: validEmail.split('@')[0],
        email: validEmail,
        passwordHash,
        role: validRole, // FIX: No more translation needed! It is exactly 'OWNER'
      }
    })

    // --- Generate Token and Send Email ---
    const verificationToken = await generateVerificationToken(validEmail)
    await sendVerificationEmail(verificationToken.identifier, verificationToken.token)

    return { success: true, error: null }

  } catch (error) {
    console.error('Registration Error:', error)
    return { error: 'Something went wrong. Please try again.', success: false }
  }
}

export async function loginUser(prevState: any, formData: FormData) {
  try {
    // 1. Extract the credentials
    const identifier = formData.get('email') as string
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
    const user = await prisma.user.findUnique({ where: { email } })
    
    if (!user) {
      return { error: "User not found." }
    }
    if (user.emailVerified) {
      return { error: "This email is already verified. Please log in." }
    }

    // Generate a fresh token and dispatch the email
    const verificationToken = await generateVerificationToken(email)
    await sendVerificationEmail(verificationToken.identifier, verificationToken.token)

    return { success: "A new verification link has been sent to your email!" }
  } catch (error) {
    console.error("Resend Email Error:", error)
    return { error: "Failed to send email. Please try again." }
  }
}