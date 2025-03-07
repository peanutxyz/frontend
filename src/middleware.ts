// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get token from cookie
  const token = request.cookies.get('token')?.value;
  
  // Check auth routes
  if (request.nextUrl.pathname.startsWith('/auth')) {
    if (token) {
      // Get user role from cookie if available, default to admin if not
      const userDataCookie = request.cookies.get('user')?.value;
      let role = 'admin';
      try {
        if (userDataCookie) {
          const userData = JSON.parse(decodeURIComponent(userDataCookie));
          role = userData.role || 'admin';
        }
      } catch (e) {
        console.error('Failed to parse user data from cookie');
      }
      
      // Add a check for a specific header that indicates the user wants to log in as a different user
      const newLogin = request.headers.get('x-new-login');
      if (newLogin === 'true') {
        return NextResponse.next();
      }
      
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
    }
    return NextResponse.next();
  }
  
  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/auth/:path*', 
    '/dashboard/:path*'
  ],
};