import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  
  try {
    // Verwende die Token-Validierung
    const baseUrl = request.nextUrl.origin;
    const response = await fetch(`${baseUrl}/api/token/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    
    if (!response.ok) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    
    const data = await response.json();
    return NextResponse.json({ 
      authenticated: true,
      verein: data.verein,
      vereinId: data.vereinId,
      role: data.role
    });
    
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
