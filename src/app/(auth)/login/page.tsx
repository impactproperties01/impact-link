import LoginForm from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Sign In | Impact Link',
  description: 'Sign in to your Impact Link account.',
}

export default function LoginPage() {
  return (
    <div className="bg-gray-50 md:min-h-screen md:flex md:items-center md:justify-center">
      <LoginForm />
    </div>
  )
}