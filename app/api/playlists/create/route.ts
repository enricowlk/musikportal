import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

const DB_PATH = path.join(process.cwd(), "data/playlists.json");
const TOKENS_DB_PATH = path.join(process.cwd(), "data/tokens.json");

interface TokenData {
  id: string;
  name: string;
  token: string;
  description: string;
  active: boolean;
  createdAt: string;
}

type Playlist = {
  id: string;
  name: string;
  songIds: string[];
  createdAt: string;
  turnierId?: string;
  createdBy?: string;
};

type RequestBody = {
  name: string;
  songIds: string[];
  turnierId?: string;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { name, songIds, turnierId } = (await req.json()) as RequestBody;

  try {
    // Hole Token aus Cookie um Ersteller zu identifizieren
    const token = req.cookies.get('auth-token')?.value;
    let createdBy = null;
    
    if (token) {
      try {
        const tokensData = await fs.readFile(TOKENS_DB_PATH, "utf-8");
        const tokens: TokenData[] = JSON.parse(tokensData);
        const userToken = tokens.find(t => t.token === token && t.active);
        if (userToken) {
          createdBy = userToken.id;
        }
      } catch {
        // Token-Validierung fehlgeschlagen
      }
    }
    
    if (!createdBy) {
      return NextResponse.json(
        { error: "Ungültiger Token" },
        { status: 401 }
      );
    }

    // Load existing playlists or initialize empty array
    let playlists: Playlist[] = [];
    try {
      const data = await fs.readFile(DB_PATH, "utf-8");
      playlists = JSON.parse(data) as Playlist[];
    } catch (readError) {
      if ((readError as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Error reading playlists file:', readError);
      }
      // If file doesn't exist, we'll start with empty array
    }

    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      songIds,
      createdAt: new Date().toISOString(),
      createdBy,
      ...(turnierId && { turnierId }),
    };

    playlists.push(newPlaylist);
    await fs.writeFile(DB_PATH, JSON.stringify(playlists, null, 2));

    return NextResponse.json(newPlaylist);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to save playlist:', error);
    return NextResponse.json(
      { 
        error: "Playlist konnte nicht gespeichert werden",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}