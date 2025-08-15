// app/api/playlists/[id]/songs/[songId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

const DB_PATH = path.join(process.cwd(), "data/playlists.json");
const TOKENS_DB_PATH = path.join(process.cwd(), "data/tokens.json");

interface Playlist {
  id: string;
  songIds: string[];
  createdBy?: string;
}

interface TokenData {
  id: string;
  name: string;
  token: string;
  description: string;
  active: boolean;
  createdAt: string;
}

async function getUserFromToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  
  try {
    const tokensData = await fs.readFile(TOKENS_DB_PATH, "utf-8");
    const tokens: TokenData[] = JSON.parse(tokensData);
    const userToken = tokens.find(t => t.token === token && t.active);
    return userToken ? userToken.id : null;
  } catch {
    return null;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; songId: string }> }
) {
  try {
    const { id, songId } = await params;

    // Prüfe Berechtigung
    const token = request.cookies.get('auth-token')?.value;
    const currentUser = await getUserFromToken(token);
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const playlist = playlists[playlistIndex];
    
    // Prüfe ob der User der Ersteller ist
    if (playlist.createdBy !== currentUser) {
      return NextResponse.json({ error: "Forbidden: You can only edit your own playlists" }, { status: 403 });
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
  } catch {
    console.error("Fehler beim Löschen des Songs");
    return NextResponse.json(
      { error: "Löschen fehlgeschlagen" },
      { status: 500 }
    );
  }
}
