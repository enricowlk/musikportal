import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

interface TokenData {
  id: string;
  name: string;
  token: string;
  description: string;
  role: 'admin' | 'ausrichter' | 'formation';
  active: boolean;
  createdAt: string;
}

const TOKENS_DB_PATH = path.join(process.cwd(), "data/tokens.json");

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }
    
    // Lade alle verfügbaren Tokens
    const tokensData = await fs.readFile(TOKENS_DB_PATH, "utf-8");
    const tokens: TokenData[] = JSON.parse(tokensData);
    
    // Prüfe ob der Token gültig und aktiv ist
    const validToken = tokens.find(t => t.token === token && t.active);
    
    if (validToken) {
      return NextResponse.json({ 
        valid: true,
        verein: validToken.name,
        vereinId: validToken.id,
        role: validToken.role
      });
    }
    
    return NextResponse.json({ valid: false }, { status: 401 });
    
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
