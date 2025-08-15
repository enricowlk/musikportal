import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

interface Playlist {
  id: string;
  name: string;
  songIds: string[];
  createdAt: string;
  turnierId?: string;
  createdBy?: string;
}

interface TokenData {
  id: string;
  name: string;
  token: string;
  description: string;
  active: boolean;
  createdAt: string;
}

const PLAYLISTS_DB_PATH = path.join(process.cwd(), "data/playlists.json");
const TOKENS_DB_PATH = path.join(process.cwd(), "data/tokens.json");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Hole Token aus Cookie
    const token = request.cookies.get('auth-token')?.value;
    let currentUserId = null;
    
    if (token) {
      try {
        const tokensData = await fs.readFile(TOKENS_DB_PATH, "utf-8");
        const tokens: TokenData[] = JSON.parse(tokensData);
        const userToken = tokens.find(t => t.token === token && t.active);
        if (userToken) {
          currentUserId = userToken.id;
        }
      } catch {
        // Token-Validierung fehlgeschlagen
      }
    }
    
    // Lade Playlist
    const playlistsData = await fs.readFile(PLAYLISTS_DB_PATH, "utf-8");
    const playlists: Playlist[] = JSON.parse(playlistsData);
    const playlist = playlists.find(p => p.id === id);
    
    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }
    
    // Prüfe Berechtigungen
    const canEdit = playlist.createdBy === currentUserId;
    
    return NextResponse.json({
      canEdit,
      playlistCreatedBy: playlist.createdBy,
      currentUser: currentUserId
    });
    
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
