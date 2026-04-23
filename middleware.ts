import { NextRequest, NextResponse } from 'next/server'

const COOKIE = 'admin_auth'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow login page and login API through
  if (pathname === '/admin/login' || pathname === '/api/admin-login') {
    return NextResponse.next()
  }

  // Protect all /admin routes
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get(COOKIE)?.value
    if (token !== process.env.ADMIN_PASSWORD) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
