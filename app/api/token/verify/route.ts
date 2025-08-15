import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

interface TokenData {
  id: string;
  name: string;
  token: string;
  description: string;
  active: boolean;
  createdAt: string;
}

const TOKENS_DB_PATH = path.join(process.cwd(), "data/tokens.json");

export async function POST(req: Request) {
  const { token } = await req.json();
  
  try {
    // Lade alle verfügbaren Tokens
    const tokensData = await fs.readFile(TOKENS_DB_PATH, "utf-8");
    const tokens: TokenData[] = JSON.parse(tokensData);
    
    // Prüfe ob der Token gültig und aktiv ist
    const validToken = tokens.find(t => t.token === token && t.active);
    
    if (validToken) {
      const response = NextResponse.json({ 
        success: true, 
        verein: validToken.name,
        vereinId: validToken.id
      });
      
      // Setze sowohl den Token als auch die Verein-Info als Cookie
      response.cookies.set("auth-token", token, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30 // 30 Tage
      });
      
      response.cookies.set("verein-info", JSON.stringify({
        id: validToken.id,
        name: validToken.name
      }), { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30 // 30 Tage
      });
      
      return response;
    }
    
    return NextResponse.json({ success: false, error: "Ungültiger Token" }, { status: 401 });
    
  } catch (error) {
    console.error("Fehler beim Token-Check:", error);
    return NextResponse.json({ success: false, error: "Server Fehler" }, { status: 500 });
  }
}