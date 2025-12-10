import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // If user hasn't completed onboarding, redirect to onboarding
    // (except if they're already on onboarding or auth pages)
    if (token && token.onboardingComplete === false) {
      if (!pathname.startsWith('/onboarding') && !pathname.startsWith('/auth') && !pathname.startsWith('/api')) {
        return NextResponse.redirect(new URL('/onboarding', req.url))
      }
    }

    // If user has completed onboarding and is trying to access onboarding page, redirect to dashboard
    if (token && token.onboardingComplete === true && pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to onboarding page without full auth (for new users)
        if (req.nextUrl.pathname.startsWith('/onboarding')) {
          return true
        }
        return !!token
      }
    }
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/phases/:path*',
    '/products/:path*',
    '/modalities/:path*',
    '/onboarding/:path*',
    '/onboarding'
  ]
}
