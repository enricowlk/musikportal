import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

const DB_PATH = path.join(process.cwd(), "data/playlists.json");

type Playlist = {
  id: string;
  name: string;
  songIds: string[];
  createdAt: string;
};

export async function POST(req: Request) {
  const { name, songIds } = await req.json();

  try {
    // Existierende Playlists laden oder neue erstellen
    let playlists: Playlist[] = [];
    try {
      const data = await fs.readFile(DB_PATH, "utf-8");
      playlists = JSON.parse(data);
    } catch {}

    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      songIds,
      createdAt: new Date().toISOString(),
    };

    playlists.push(newPlaylist);
    await fs.writeFile(DB_PATH, JSON.stringify(playlists, null, 2));

    return NextResponse.json(newPlaylist);
  } catch (error) {
    return NextResponse.json(
      { error: "Playlist konnte nicht gespeichert werden" },
      { status: 500 }
    );
  }
}