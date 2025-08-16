import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authToken = request.cookies.get('auth-token')?.value;
  const vereinInfo = request.cookies.get('verein-info')?.value;
  const debugAuth = request.cookies.get('debug-auth')?.value;
  
  const allCookies = Object.fromEntries(
    request.cookies.getAll().map(cookie => [cookie.name, cookie.value])
  );
  
  return NextResponse.json({
    authToken: authToken || null,
    vereinInfo: vereinInfo || null,
    debugAuth: debugAuth || null,
    allCookies,
    userAgent: request.headers.get('user-agent'),
    timestamp: new Date().toISOString()
  });
}
