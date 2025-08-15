import { NextResponse, NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  try {
    // Verwende die interne API Route für Token-Validierung
    // Dies ist Edge Runtime kompatibel
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
    
    return NextResponse.next();
    
  } catch {
    // Bei Fehlern redirect zur Startseite
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*', '/dashboard/playlists/:id*', '/dashboard/upload/:path*'],
};