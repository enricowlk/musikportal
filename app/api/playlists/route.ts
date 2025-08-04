// app/api/playlists/route.ts
import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

const DB_PATH = path.join(process.cwd(), "data/playlists.json");

export async function GET() {
  try {
    const data = await fs.readFile(DB_PATH, "utf-8");
    const playlists = JSON.parse(data);
    
    return NextResponse.json(playlists.map((p: any) => ({
      id: p.id,
      name: p.name,
      songIds: p.songIds || [],
      createdAt: p.createdAt || new Date().toISOString(),
    })));
  } catch (error) {
    return NextResponse.json(
      { error: "Playlists konnten nicht geladen werden" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await fs.readFile(DB_PATH, "utf-8");
    const playlists = JSON.parse(data);
    
    const updated = playlists.filter((p: any) => p.id !== params.id);
    await fs.writeFile(DB_PATH, JSON.stringify(updated, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Playlist konnte nicht gelöscht werden" },
      { status: 500 }
    );
  }
}