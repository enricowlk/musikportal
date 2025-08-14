// app/api/turniere/[id]/route.ts
import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

interface Turnier {
  id: string;
  name: string;
  datum: string;
  ort: string;
  veranstalter: string;
  status: 'anstehend' | 'laufend' | 'abgeschlossen';
  beschreibung?: string;
}

const TURNIERE_DB_PATH = path.join(process.cwd(), "data/turniere.json");
const PLAYLISTS_DB_PATH = path.join(process.cwd(), "data/playlists.json");

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const turniereData = await fs.readFile(TURNIERE_DB_PATH, "utf-8");
    const turniere: Turnier[] = JSON.parse(turniereData);
    
    const turnier = turniere.find(t => t.id === id);
    
    if (!turnier) {
      return NextResponse.json(
        { error: "Turnier nicht gefunden" },
        { status: 404 }
      );
    }
    
    // Lade auch die Playlists für dieses Turnier
    try {
      const playlistsData = await fs.readFile(PLAYLISTS_DB_PATH, "utf-8");
      const playlists = JSON.parse(playlistsData);
      const turnierPlaylists = playlists
        .filter((p: any) => p.turnierId === id)
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          songCount: p.songIds?.length || 0,
          updatedAt: p.createdAt || new Date().toISOString(),
          turnierId: p.turnierId,
          turnierName: turnier.name,
        }));
      
      return NextResponse.json({
        ...turnier,
        playlists: turnierPlaylists
      });
    } catch {
      // Falls Playlists nicht geladen werden können, gib nur das Turnier zurück
      return NextResponse.json({
        ...turnier,
        playlists: []
      });
    }
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Turnier konnte nicht geladen werden", details: errorMessage },
      { status: 500 }
    );
  }
}
