import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // Define the main domain
  const mainDomain = 'onbrandai.app';
  
  // Check if using a custom domain (not Netlify's default)
  const isCustomDomain = hostname.includes(mainDomain);
  
  if (isCustomDomain) {
    // Handle subdomains
    const subdomain = hostname.replace(`.${mainDomain}`, '');
    
    // Ignore www subdomain and treat it as main domain
    if (subdomain === 'www') {
      return NextResponse.rewrite(new URL(`/${pathname}${search}`, request.url));
    }
    
    // If we have a subdomain, rewrite to the /brand/[brandName] route
    if (subdomain !== mainDomain) {
      return NextResponse.rewrite(
        new URL(`/brand/${subdomain}${pathname === '/' ? '' : pathname}${search}`, request.url)
      );
    }
  }

  // Default handling - no modification to the request
  return NextResponse.next();
}

export const config = {
  // Match all pathnames except for assets, api routes, and other static files
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
