import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from './lib/auth';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isPublicPath = path === '/login';

  const sessionCookie = request.cookies.get('session')?.value;
  let session = null;
  try {
    if (sessionCookie) session = await decrypt(sessionCookie);
  } catch (e) {
    // invalid token
  }

  if (!isPublicPath && !session) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  if (isPublicPath && session) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  // Redirect root to dashboard
  if (path === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
