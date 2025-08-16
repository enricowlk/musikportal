// app/api/playlists/[id]/songs/route.ts
import { NextResponse, type NextRequest } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { parseBuffer } from "music-metadata";

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
  artist: string;
  duration: number;
}

const DB_PATH = path.join(process.cwd(), "data/playlists.json");
const UPLOADS_DIR = path.join(process.cwd(), "public/uploads");

// Hilfsfunktionen für Metadaten-Extraktion (kopiert aus upload route)
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

    // Zurückgegebene Songs erstellen mit vollständigen Metadaten
    const addedSongs: Song[] = await Promise.all(
      newSongIds.map(async (id) => {
        try {
          // Metadaten aus der Datei lesen
          const filePath = path.join(UPLOADS_DIR, id);
          const fileBuffer = await fs.readFile(filePath);
          const metadata = await parseBuffer(fileBuffer);

          // Intelligente Metadaten-Extraktion
          const extractedTitle = extractTitleFromFilename(id);
          const artistInfo = extractArtistFromFilename(id);

          return {
            id,
            path: `/uploads/${encodeURIComponent(id)}`,
            filename: id,
            // Verwende die track-Eigenschaft als bevorzugten Titel falls verfügbar
            title: metadata.common.title || artistInfo.track || extractedTitle || id.replace(/\.[^/.]+$/, ""),
            artist: metadata.common.artist || artistInfo.artist || "Unbekannter Künstler",
            duration: metadata.format?.duration || 0,
          };
        } catch (error) {
          console.warn(`Could not parse metadata for ${id}:`, error);
          // Fallback: Nur Dateiname-basierte Extraktion
          const extractedTitle = extractTitleFromFilename(id);
          const artistInfo = extractArtistFromFilename(id);
          
          return {
            id,
            path: `/uploads/${encodeURIComponent(id)}`,
            filename: id,
            // Verwende die track-Eigenschaft als bevorzugten Titel falls verfügbar
            title: artistInfo.track || extractedTitle || id.replace(/\.[^/.]+$/, ""),
            artist: artistInfo.artist || "Unbekannter Künstler",
            duration: 0,
          };
        }
      })
    );

    return NextResponse.json(addedSongs);
  } catch (error: unknown) {
    console.error("POST error:", error);
    return NextResponse.json(
      { error: "Failed to add songs" },
      { status: 500 }
    );
  }
}
