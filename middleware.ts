import { NextResponse, NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const debugAuth = request.cookies.get('debug-auth')?.value;
  
  console.log('Middleware Debug:', {
    path: request.nextUrl.pathname,
    hasAuthToken: !!token,
    hasDebugAuth: !!debugAuth,
    userAgent: request.headers.get('user-agent')?.includes('Mac') ? 'Mac' : 'Other',
    cookieNames: request.cookies.getAll().map(c => c.name)
  });
  
  if (!token) {
    console.log('No auth token found, redirecting to home');
    const redirectResponse = NextResponse.redirect(new URL('/', request.url));
    // Lösche alle Auth-Cookies beim Redirect
    redirectResponse.cookies.delete('auth-token');
    redirectResponse.cookies.delete('verein-info');
    redirectResponse.cookies.delete('debug-auth');
    return redirectResponse;
  }
  
  try {
    // Verwende die interne API Route für Token-Validierung
    const baseUrl = request.nextUrl.origin;
    const response = await fetch(`${baseUrl}/api/token/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    
    if (!response.ok) {
      console.log('Token validation failed');
      // Token ungültig - lösche Cookies und redirect zur Startseite
      const redirectResponse = NextResponse.redirect(new URL('/', request.url));
      redirectResponse.cookies.delete('auth-token');
      redirectResponse.cookies.delete('verein-info');
      redirectResponse.cookies.delete('debug-auth');
      return redirectResponse;
    }
    
    console.log('Token validation successful');
    return NextResponse.next();
    
  } catch (error) {
    console.log('Token validation error:', error);
    // Bei Fehlern redirect zur Startseite
    const redirectResponse = NextResponse.redirect(new URL('/', request.url));
    redirectResponse.cookies.delete('auth-token');
    redirectResponse.cookies.delete('verein-info');
    redirectResponse.cookies.delete('debug-auth');
    return redirectResponse;
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*', '/dashboard/playlists/:id*', '/dashboard/upload/:path*'],
};