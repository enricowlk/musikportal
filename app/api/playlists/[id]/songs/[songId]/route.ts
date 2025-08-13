// app/api/playlists/[id]/songs/[songId]/route.ts
import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

const DB_PATH = path.join(process.cwd(), "data/playlists.json");

interface Playlist {
  id: string;
  songIds: string[];
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; songId: string }> }
) {
  try {
    const { id, songId } = await params;

    // Playlists laden
    const data = await fs.readFile(DB_PATH, "utf-8");
    const playlists: Playlist[] = JSON.parse(data);

    // Die spezifische Playlist finden
    const playlistIndex = playlists.findIndex((p) => p.id === id);
    if (playlistIndex === -1) {
      return NextResponse.json(
        { error: "Playlist nicht gefunden" },
        { status: 404 }
      );
    }

    // Song aus der Playlist entfernen
    const initialSongCount = playlists[playlistIndex].songIds.length;
    playlists[playlistIndex].songIds = playlists[playlistIndex].songIds.filter(
      (sid) => sid !== songId
    );

    // Nur speichern, wenn sich etwas geändert hat
    if (playlists[playlistIndex].songIds.length < initialSongCount) {
      await fs.writeFile(DB_PATH, JSON.stringify(playlists, null, 2));
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Song nicht in der Playlist gefunden" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Fehler beim Löschen des Songs:", error);
    return NextResponse.json(
      { error: "Löschen fehlgeschlagen" },
      { status: 500 }
    );
  }
}
