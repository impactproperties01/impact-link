export function authErrorMessage(code?: string) {
  if (!code) return ''
  switch (code) {
    case 'OAuthAccountNotLinked':
      return 'This email already has an account using another sign-in method. Sign in with your email and password.'
    case 'AccessDenied':
      return 'Google sign-in was cancelled or access was denied. Please try again.'
    case 'Configuration':
      return 'Google sign-in is temporarily unavailable. Please use your email and password or try again later.'
    case 'CredentialsSignin':
      return 'Invalid email or password.'
    default:
      return 'Could not complete sign-in. Please try again.'
  }
}
