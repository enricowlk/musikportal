// app/api/playlists/[id]/route.ts
import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import type { NextRequest } from "next/server";
import { parseBuffer } from "music-metadata";

interface Song {
  id: string;
  path: string;
  filename: string;
  title: string;
  artist: string;
  duration: number;
}

interface Playlist {
  id: string;
  name: string;
  songIds: string[];
  createdBy?: string;
  turnierId?: string;
}

interface Turnier {
  id: string;
  name: string;
  datum: string;
  ort: string;
  veranstalter: string;
  status: 'anstehend' | 'laufend' | 'abgeschlossen';
  beschreibung?: string;
}

interface TokenData {
  id: string;
  name: string;
  token: string;
  description: string;
  active: boolean;
  createdAt: string;
}

interface PlaylistResponse {
  name: string;
  songs: Song[];
  turnier?: {
    id: string;
    name: string;
    datum: string;
    ort: string;
    veranstalter: string;
    status: string;
  };
}

const DB_PATH = path.join(process.cwd(), "data/playlists.json");
const TOKENS_DB_PATH = path.join(process.cwd(), "data/tokens.json");
const TURNIERE_DB_PATH = path.join(process.cwd(), "data/turniere.json");
const UPLOADS_DIR = path.join(process.cwd(), "public/uploads");

// Hilfsfunktionen für Metadaten-Extraktion (übereinstimmend mit songs/route.ts)
function extractTitleFromFilename(filename: string): string {
  let title = filename.replace(/\.(mp3|wav|m4a|flac)$/i, '');
  title = title.replace(/^\d+_/, '');
  title = title.replace(/[_-]+/g, ' ');
  title = title.replace(/\s+/g, ' ').trim();
  title = title.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  return title || 'Unbekannter Titel';
}

function extractArtistFromFilename(filename: string): { artist: string; track: string } {
  let cleanName = filename.replace(/\.(mp3|wav|m4a|flac)$/i, '');
  cleanName = cleanName.replace(/^\d+_/, '');
  
  const separators = [' - ', '_-_', ' _ ', '-'];
  
  for (const separator of separators) {
    if (cleanName.includes(separator)) {
      const parts = cleanName.split(separator);
      if (parts.length >= 2) {
        const artist = parts[0].replace(/[_-]/g, ' ').trim();
        const track = parts.slice(1).join(' - ').replace(/[_-]/g, ' ').trim();
        
        return {
          artist: formatName(artist),
          track: formatName(track)
        };
      }
    }
  }
  
  return {
    artist: 'Unbekannter Künstler',
    track: formatName(cleanName.replace(/[_-]/g, ' '))
  };
}

function formatName(name: string): string {
  return name.replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

async function readPlaylists(): Promise<Playlist[]> {
  const data = await fs.readFile(DB_PATH, "utf-8");
  return JSON.parse(data);
}

async function writePlaylists(playlists: Playlist[]): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(playlists, null, 2));
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

    const songs: Song[] = await Promise.all(
      playlist.songIds.map(async (songId) => {
        try {
          // Metadaten aus der Datei lesen
          const filePath = path.join(UPLOADS_DIR, songId);
          const fileBuffer = await fs.readFile(filePath);
          const metadata = await parseBuffer(fileBuffer);

          // Intelligente Metadaten-Extraktion
          const extractedTitle = extractTitleFromFilename(songId);
          const artistInfo = extractArtistFromFilename(songId);

          return {
            id: songId,
            path: `/uploads/${encodeURIComponent(songId)}`,
            filename: songId,
            // Verwende die track-Eigenschaft als bevorzugten Titel falls verfügbar
            title: metadata.common.title || artistInfo.track || extractedTitle || songId.replace(/\.[^/.]+$/, ""),
            artist: metadata.common.artist || artistInfo.artist || "Unbekannter Künstler",
            duration: metadata.format?.duration || 0,
          };
        } catch (error) {
          console.warn(`Could not parse metadata for ${songId}:`, error);
          // Fallback: Nur Dateiname-basierte Extraktion
          const extractedTitle = extractTitleFromFilename(songId);
          const artistInfo = extractArtistFromFilename(songId);
          
          return {
            id: songId,
            path: `/uploads/${encodeURIComponent(songId)}`,
            filename: songId,
            // Verwende die track-Eigenschaft als bevorzugten Titel falls verfügbar
            title: artistInfo.track || extractedTitle || songId.replace(/\.[^/.]+$/, ""),
            artist: artistInfo.artist || "Unbekannter Künstler",
            duration: 0,
          };
        }
      })
    );

    // Lade Turnier-Information falls turnierId vorhanden ist
    let turnier = null;
    if (playlist.turnierId) {
      try {
        const turniereData = await fs.readFile(TURNIERE_DB_PATH, "utf-8");
        const turniere: Turnier[] = JSON.parse(turniereData);
        const foundTurnier = turniere.find(t => t.id === playlist.turnierId);
        if (foundTurnier) {
          turnier = {
            id: foundTurnier.id,
            name: foundTurnier.name,
            datum: foundTurnier.datum,
            ort: foundTurnier.ort,
            veranstalter: foundTurnier.veranstalter,
            status: foundTurnier.status
          };
        }
      } catch {
        // Falls Turnier nicht geladen werden kann, ignorieren
      }
    }

    const response: PlaylistResponse = { 
      name: playlist.name, 
      songs,
      ...(turnier && { turnier })
    };
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

    // Prüfe Berechtigung
    const token = request.cookies.get('auth-token')?.value;
    const currentUser = await getUserFromToken(token);
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const playlists = await readPlaylists();
    const playlistIndex = playlists.findIndex((p) => p.id === id);

    if (playlistIndex === -1) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    const playlist = playlists[playlistIndex];
    
    // Prüfe ob der User der Ersteller ist
    if (playlist.createdBy !== currentUser) {
      return NextResponse.json({ error: "Forbidden: You can only edit your own playlists" }, { status: 403 });
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
    
    // Prüfe Berechtigung
    const token = request.cookies.get('auth-token')?.value;
    const currentUser = await getUserFromToken(token);
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const playlists = await readPlaylists();
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
      return NextResponse.json({ error: "Forbidden: You can only delete your own playlists" }, { status: 403 });
    }

    const filteredPlaylists = playlists.filter((p) => p.id !== id);
    await writePlaylists(filteredPlaylists);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: "Löschen fehlgeschlagen" }, { status: 500 });
  }
}

// PATCH - Update song order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { songIds } = await request.json();

    if (!songIds || !Array.isArray(songIds)) {
      return NextResponse.json(
        { error: "Invalid song IDs provided" },
        { status: 400 }
      );
    }

    // Prüfe Berechtigung
    const token = request.cookies.get('auth-token')?.value;
    const currentUser = await getUserFromToken(token);
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const playlists = await readPlaylists();
    const playlistIndex = playlists.findIndex((p) => p.id === id);

    if (playlistIndex === -1) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }

    const playlist = playlists[playlistIndex];
    
    // Prüfe ob der User der Ersteller ist
    if (playlist.createdBy !== currentUser) {
      return NextResponse.json({ error: "Forbidden: You can only edit your own playlists" }, { status: 403 });
    }

    playlists[playlistIndex].songIds = songIds;
    await writePlaylists(playlists);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update song order" },
      { status: 500 }
    );
  }
}