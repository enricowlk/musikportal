import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { token } = await req.json();
  const isValid = token === process.env.STATIC_ACCESS_TOKEN;

  if (isValid) {
    const response = NextResponse.json({ success: true });
    response.cookies.set("auth-token", token, { httpOnly: true });
    return response;
  }

  return NextResponse.json({ success: false }, { status: 401 });
}