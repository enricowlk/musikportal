// app/api/playlists/[id]/route.ts
import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

const DB_PATH = path.join(process.cwd(), "data/playlists.json");

// GET-Methode (existierte bereits)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const playlistsData = await fs.readFile(DB_PATH, "utf-8");
    const playlist = JSON.parse(playlistsData).find((p: any) => p.id === params.id);

    if (!playlist) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const songs = playlist.songIds.map((id: string) => ({
      id,
      path: `/uploads/${id}`,
      filename: id
    }));

    return NextResponse.json({
      name: playlist.name,
      songs
    });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// NEUE DELETE-Methode
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Playlists laden
    const data = await fs.readFile(DB_PATH, "utf-8");
    let playlists = JSON.parse(data);

    // Playlist filtern
    const initialLength = playlists.length;
    playlists = playlists.filter((p: any) => p.id !== params.id);

    // Nur speichern wenn sich was geändert hat
    if (playlists.length < initialLength) {
      await fs.writeFile(DB_PATH, JSON.stringify(playlists, null, 2));
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Playlist nicht gefunden" },
        { status: 404 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Löschen fehlgeschlagen" },
      { status: 500 }
    );
  }
}