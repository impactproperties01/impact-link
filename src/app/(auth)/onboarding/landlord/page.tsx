import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import PropertyOwnerOnboarding from '@/components/auth/PropertyOwnerOnboarding'

export const metadata = {
  title: 'Property Owner Onboarding | Impact Link',
}

export default async function LandlordOnboardingPage() {
  const session = await auth()

  // SECURITY: If they are already verified, kick them back to the dashboard!
  if ((session?.user as any)?.isVerified) {
    redirect('/dashboard')
  }

  return <PropertyOwnerOnboarding />
}