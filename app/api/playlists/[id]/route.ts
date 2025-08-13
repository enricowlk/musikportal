// app/api/playlists/[id]/route.ts
import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import type { NextRequest } from "next/server";

interface Song {
  id: string;
  path: string;
  filename: string;
}

interface Playlist {
  id: string;
  name: string;
  songIds: string[];
}

interface PlaylistResponse {
  name: string;
  songs: Song[];
}

const DB_PATH = path.join(process.cwd(), "data/playlists.json");

async function readPlaylists(): Promise<Playlist[]> {
  const data = await fs.readFile(DB_PATH, "utf-8");
  return JSON.parse(data);
}

async function writePlaylists(playlists: Playlist[]): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(playlists, null, 2));
}

// GET
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const playlists = await readPlaylists();
    const playlist = playlists.find((p) => p.id === id);

    if (!playlist) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const songs: Song[] = playlist.songIds.map((songId) => ({
      id: songId,
      path: `/uploads/${songId}`,
      filename: songId,
    }));

    const response: PlaylistResponse = { name: playlist.name, songs };
    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Invalid name provided" },
        { status: 400 }
      );
    }

    const playlists = await readPlaylists();
    const playlistIndex = playlists.findIndex((p) => p.id === id);

    if (playlistIndex === -1) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    playlists[playlistIndex].name = name;
    await writePlaylists(playlists);

    return NextResponse.json({ success: true, name });
  } catch (error: unknown) {
    console.error("PUT error:", error);
    return NextResponse.json({ error: "Failed to update playlist" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const playlists = await readPlaylists();
    const initialLength = playlists.length;

    const filteredPlaylists = playlists.filter((p) => p.id !== id);

    if (filteredPlaylists.length < initialLength) {
      await writePlaylists(filteredPlaylists);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Playlist nicht gefunden" },
        { status: 404 }
      );
    }
  } catch (error: unknown) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: "Löschen fehlgeschlagen" }, { status: 500 });
  }
}
