// app/api/playlists/[id]/songs/route.ts
import { NextResponse, type NextRequest } from "next/server";
import path from "path";
import { promises as fs } from "fs";

interface Playlist {
  id: string;
  name: string;
  songIds: string[];
}

interface Song {
  id: string;
  path: string;
  filename: string;
  title: string;
}

const DB_PATH = path.join(process.cwd(), "data/playlists.json");

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  const params = await context.params; // await, weil Promise

  try {
    const { songIds }: { songIds: string[] } = await request.json();

    // Playlists laden
    const data = await fs.readFile(DB_PATH, "utf-8");
    const playlists: Playlist[] = JSON.parse(data);

    // Playlist finden
    const playlistIndex = playlists.findIndex((p) => p.id === params.id);
    if (playlistIndex === -1) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 }
      );
    }

    // Neue Songs hinzufügen (ohne Duplikate)
    const existingSongIds = new Set(playlists[playlistIndex].songIds);
    const newSongIds = songIds.filter((id) => !existingSongIds.has(id));
    playlists[playlistIndex].songIds.push(...newSongIds);

    // Speichern
    await fs.writeFile(DB_PATH, JSON.stringify(playlists, null, 2));

    // Zurückgegebene Songs erstellen
    const addedSongs: Song[] = newSongIds.map((id) => ({
      id,
      path: `/uploads/${encodeURIComponent(id)}`, // Enkodiere Dateinamen für URL-Sicherheit
      filename: id,
      title: id.replace(/\.[^/.]+$/, ""),
    }));

    return NextResponse.json(addedSongs);
  } catch (error: unknown) {
    console.error("POST error:", error);
    return NextResponse.json(
      { error: "Failed to add songs" },
      { status: 500 }
    );
  }
}
