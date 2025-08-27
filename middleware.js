// middleware.js
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // ✅ Skip middleware for API routes, static files, and Next internals
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(.*)$/) // skip static file extensions
  ) {
    return NextResponse.next();
  }

  // ✅ Only protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      // Not logged in → send to login
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Role-based protection
    if (pathname.startsWith('/dashboard/admin') && token.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    if (pathname.startsWith('/dashboard/educator') && token.role !== 'educator') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    if (pathname.startsWith('/dashboard/student') && token.role !== 'student') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

// ✅ Limit matching to dashboard pages only
export const config = {
  matcher: [
    '/dashboard/:path*', // Protect all dashboard routes
  ],
};
