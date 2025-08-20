// app/api/playlists/route.ts
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

interface Playlist {
  id: string;
  name: string;
  songIds: string[];
  createdAt: string;
  turnierId?: string;
  createdBy?: string;
}

interface Turnier {
  id: string;
  name: string;
  datum: string;
  ort: string;
  ausrichter: string;
  status: string;
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
const TURNIERE_DB_PATH = path.join(process.cwd(), "data/turniere.json");
const TOKENS_DB_PATH = path.join(process.cwd(), "data/tokens.json");

// Disable caching for this API route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Hole Token aus Cookie
    const token = request.cookies.get('auth-token')?.value;
    let currentVereinId = null;
    
    if (token) {
      try {
        const tokensData = await fs.readFile(TOKENS_DB_PATH, "utf-8");
        const tokens: TokenData[] = JSON.parse(tokensData);
        const userToken = tokens.find(t => t.token === token && t.active);
        if (userToken) {
          currentVereinId = userToken.id;
        }
      } catch {
        // Token-Validierung fehlgeschlagen
      }
    }
    
    const playlistsData = await fs.readFile(PLAYLISTS_DB_PATH, "utf-8");
    const playlists: Playlist[] = JSON.parse(playlistsData);
    
    // Filtere Playlists nach Verein (nur eigene Playlists anzeigen)
    const userPlaylists = currentVereinId 
      ? playlists.filter(playlist => playlist.createdBy === currentVereinId)
      : [];
    
    // Lade Turniere für Zuordnung
    let turniere: Turnier[] = [];
    try {
      const turniereData = await fs.readFile(TURNIERE_DB_PATH, "utf-8");
      turniere = JSON.parse(turniereData);
    } catch {
      // Falls Turniere nicht geladen werden können, ignorieren wir das
    }
    
    // Erweitere Playlists mit Turnier-Informationen
    const enrichedPlaylists = userPlaylists.map((playlist) => {
      const turnier = playlist.turnierId ? turniere.find(t => t.id === playlist.turnierId) : null;
      
      return {
        id: playlist.id,
        name: playlist.name,
        songIds: playlist.songIds || [],
        createdAt: playlist.createdAt || new Date().toISOString(),
        turnierId: playlist.turnierId,
        turnierName: turnier?.name,
      };
    });
    
    return NextResponse.json(enrichedPlaylists);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Playlists konnten nicht geladen werden", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Hole die ID aus den URL-Parametern
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json(
        { error: "Playlist-ID fehlt" },
        { status: 400 }
      );
    }

    const data = await fs.readFile(PLAYLISTS_DB_PATH, "utf-8");
    const playlists: Playlist[] = JSON.parse(data);
    
    const updated = playlists.filter((p) => p.id !== id);
    await fs.writeFile(PLAYLISTS_DB_PATH, JSON.stringify(updated, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Playlist konnte nicht gelöscht werden", details: errorMessage },
      { status: 500 }
    );
  }
}