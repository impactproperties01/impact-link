import { auth } from "@/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const user = req.auth?.user as any // Now contains .role and .isVerified
  const path = req.nextUrl.pathname

  const isAuthRoute = path.startsWith('/login') || path.startsWith('/register')
  const isDashboardRoute = path.startsWith('/dashboard')
  const isOnboardingRoute = path.startsWith('/onboarding')

  // 1. Redirect logged-out users away from protected pages
  if ((isDashboardRoute || isOnboardingRoute) && !isLoggedIn) {
    return Response.redirect(new URL('/login', req.nextUrl))
  }

  // 2. Global Onboarding Interceptor for Landlords/Owners
  if (isLoggedIn && isDashboardRoute && user?.isVerified === false) {
    if (user?.role === 'OWNER' || user?.role === 'LANDLORD') {
      return Response.redirect(new URL('/onboarding/landlord', req.nextUrl))
    }
  }

  // 3. Redirect logged-in users away from Auth pages
  if (isAuthRoute && isLoggedIn) {
    // Check if they need onboarding before blindly sending to dashboard
    if (user?.isVerified === false && (user?.role === 'OWNER' || user?.role === 'LANDLORD')) {
      return Response.redirect(new URL('/onboarding/landlord', req.nextUrl))
    }
    return Response.redirect(new URL('/dashboard', req.nextUrl))
  }
})

// Specify which routes the middleware should run on
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|hero-image.png|logo.png).*)',
  ],
}