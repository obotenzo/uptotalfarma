import { NextResponse } from 'next/server';

export function proxy(request) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/dashboard')) return NextResponse.next();

  const session = request.cookies.get('uptf_session')?.value;
  if (session === 'AdminUpTotalFarma') return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = '/login';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
