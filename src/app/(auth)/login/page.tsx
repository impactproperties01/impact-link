import LoginForm from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Sign In | Impact Link',
  description: 'Sign in to your Impact Link account.',
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string | string[] }> }) {
  const { error } = await searchParams
  const oauthError = Array.isArray(error) ? error[0] : error
  return (
    <div className="bg-gray-50 md:min-h-screen md:flex md:items-center md:justify-center">
      <LoginForm oauthError={oauthError} />
    </div>
  )
}
