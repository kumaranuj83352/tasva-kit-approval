import { NextRequest, NextResponse } from 'next/server'

// Protected routes — redirect to /login if no token
const PROTECTED_PATHS = ['/dashboard', '/kits', '/admin']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  // The access token is managed client-side in localStorage.
  // For SSR route protection we rely on the refresh cookie.
  const refreshCookie = req.cookies.get('refresh_token')
  if (!refreshCookie) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/kits/:path*', '/admin/:path*'],
}
