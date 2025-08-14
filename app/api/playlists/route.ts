// app/api/playlists/route.ts
import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

interface Playlist {
  id: string;
  name: string;
  songIds: string[];
  createdAt: string;
  turnierId?: string;
}

interface Turnier {
  id: string;
  name: string;
  datum: string;
  ort: string;
  veranstalter: string;
  status: string;
}

const PLAYLISTS_DB_PATH = path.join(process.cwd(), "data/playlists.json");
const TURNIERE_DB_PATH = path.join(process.cwd(), "data/turniere.json");

export async function GET() {
  try {
    const playlistsData = await fs.readFile(PLAYLISTS_DB_PATH, "utf-8");
    const playlists: Playlist[] = JSON.parse(playlistsData);
    
    // Lade Turniere für Zuordnung
    let turniere: Turnier[] = [];
    try {
      const turniereData = await fs.readFile(TURNIERE_DB_PATH, "utf-8");
      turniere = JSON.parse(turniereData);
    } catch {
      // Falls Turniere nicht geladen werden können, ignorieren wir das
    }
    
    // Erweitere Playlists mit Turnier-Informationen
    const enrichedPlaylists = playlists.map((playlist) => {
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