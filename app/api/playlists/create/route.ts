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

type RequestBody = {
  name: string;
  songIds: string[];
};

export async function POST(req: Request): Promise<NextResponse> {
  const { name, songIds } = (await req.json()) as RequestBody;

  try {
    // Load existing playlists or initialize empty array
    let playlists: Playlist[] = [];
    try {
      const data = await fs.readFile(DB_PATH, "utf-8");
      playlists = JSON.parse(data) as Playlist[];
    } catch (readError) {
      if ((readError as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Error reading playlists file:', readError);
      }
      // If file doesn't exist, we'll start with empty array
    }

    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      songIds,
      createdAt: new Date().toISOString(),
    };

    playlists.push(newPlaylist);
    await fs.writeFile(DB_PATH, JSON.stringify(playlists, null, 2));

    return NextResponse.json(newPlaylist);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to save playlist:', error);
    return NextResponse.json(
      { 
        error: "Playlist konnte nicht gespeichert werden",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}