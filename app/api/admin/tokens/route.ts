import { NextRequest, NextResponse } from "next/server";
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

export async function GET() {
  try {
    const tokensData = await fs.readFile(TOKENS_DB_PATH, "utf-8");
    const tokens: TokenData[] = JSON.parse(tokensData);
    
    // Entferne die eigentlichen Token aus der Response aus Sicherheitsgründen
    const safeTokens = tokens.map(token => ({
      id: token.id,
      name: token.name,
      description: token.description,
      active: token.active,
      createdAt: token.createdAt,
      tokenPreview: `${token.token.substring(0, 4)}...${token.token.substring(token.token.length - 4)}`
    }));
    
    return NextResponse.json(safeTokens);
  } catch {
    return NextResponse.json(
      { error: "Fehler beim Laden der Token" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json();
    
    // Generiere einen neuen Token
    const newToken = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    
    const tokensData = await fs.readFile(TOKENS_DB_PATH, "utf-8");
    const tokens: TokenData[] = JSON.parse(tokensData);
    
    const newTokenData: TokenData = {
      id: `verein-${Date.now()}`,
      name,
      token: newToken,
      description,
      active: true,
      createdAt: new Date().toISOString()
    };
    
    tokens.push(newTokenData);
    
    await fs.writeFile(TOKENS_DB_PATH, JSON.stringify(tokens, null, 2));
    
    return NextResponse.json({
      message: "Token erfolgreich erstellt",
      token: newToken,
      id: newTokenData.id
    });
  } catch {
    return NextResponse.json(
      { error: "Fehler beim Erstellen des Tokens" },
      { status: 500 }
    );
  }
}
