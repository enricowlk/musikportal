import { NextResponse, NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    const redirectResponse = NextResponse.redirect(new URL('/', request.url));
    // Lösche alle Auth-Cookies beim Redirect
    redirectResponse.cookies.delete('auth-token');
    redirectResponse.cookies.delete('verein-info');
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
      // Token ungültig - lösche Cookies und redirect zur Startseite
      const redirectResponse = NextResponse.redirect(new URL('/', request.url));
      redirectResponse.cookies.delete('auth-token');
      redirectResponse.cookies.delete('verein-info');
      return redirectResponse;
    }

    const data = await response.json();
    const userRole = data.role;
    const pathname = request.nextUrl.pathname;
    
    // Rollenbasierte Zugriffskontrolle
    // Formationen dürfen nur auf Upload-Seiten zugreifen
    if (userRole === 'formation') {
      if (!pathname.startsWith('/dashboard/upload')) {
        return NextResponse.redirect(new URL('/dashboard/upload', request.url));
      }
    }
    
    // Alle anderen Rollen haben normalen Zugriff
    return NextResponse.next();
    
  } catch (error) {
    // Bei Fehlern redirect zur Startseite
    const redirectResponse = NextResponse.redirect(new URL('/', request.url));
    redirectResponse.cookies.delete('auth-token');
    redirectResponse.cookies.delete('verein-info');
    return redirectResponse;
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*', '/dashboard/playlists/:id*', '/dashboard/upload/:path*'],
};