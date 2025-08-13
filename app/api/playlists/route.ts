// app/api/playlists/route.ts
import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

interface Playlist {
  id: string;
  name: string;
  songIds: string[];
  createdAt: string;
}

const DB_PATH = path.join(process.cwd(), "data/playlists.json");

export async function GET() {
  try {
    const data = await fs.readFile(DB_PATH, "utf-8");
    const playlists: Playlist[] = JSON.parse(data);
    
    return NextResponse.json(playlists.map((p) => ({
      id: p.id,
      name: p.name,
      songIds: p.songIds || [],
      createdAt: p.createdAt || new Date().toISOString(),
    })));
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

    const data = await fs.readFile(DB_PATH, "utf-8");
    const playlists: Playlist[] = JSON.parse(data);
    
    const updated = playlists.filter((p) => p.id !== id);
    await fs.writeFile(DB_PATH, JSON.stringify(updated, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Playlist konnte nicht gelöscht werden", details: errorMessage },
      { status: 500 }
    );
  }
}