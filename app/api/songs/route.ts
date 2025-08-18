// app/api/songs/route.ts
import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { parseBuffer } from "music-metadata";

// Disable caching for this API route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Production-safe path resolution
    const uploadsPath = path.resolve(process.cwd(), "public", "uploads");
    const files = await fs.readdir(uploadsPath);
    const audioFiles = files.filter(file => /\.(mp3|wav|m4a|flac)$/i.test(file));
    
    const songs = await Promise.all(
      audioFiles.map(async (file) => {
        try {
          // Metadaten aus der Datei lesen - Production-safe
          const filePath = path.resolve(process.cwd(), "public", "uploads", file);
          const fileBuffer = await fs.readFile(filePath);
          const metadata = await parseBuffer(fileBuffer);

          // Intelligente Metadaten-Extraktion (gleiche Funktionen wie beim Upload)
          const extractedTitle = extractTitleFromFilename(file);
          const artistInfo = extractArtistFromFilename(file);

          return {
            id: file,
            filename: file,
            path: `/api/uploads/${encodeURIComponent(file)}`, // Use API route instead of static path
            // Verwende die bessere Version von Titel und Künstler
            title: metadata.common.title || extractedTitle || file.replace(/\.[^/.]+$/, ""),
            artist: metadata.common.artist || artistInfo.artist || "Unbekannter Künstler",
            // Zusätzliche Metadaten
            album: metadata.common.album || "Tanzen Musik Website",
            duration: metadata.format?.duration || 0,
            genre: metadata.common.genre?.[0] || "Dance",
            // Fallback-Informationen
            extractedTitle: extractedTitle,
            extractedArtist: artistInfo.artist,
            originalTitle: metadata.common.title,
            originalArtist: metadata.common.artist
          };
        } catch (error) {
          console.warn(`Could not parse metadata for ${file}:`, error);
          // Fallback: Nur Dateiname-basierte Extraktion
          const extractedTitle = extractTitleFromFilename(file);
          const artistInfo = extractArtistFromFilename(file);
          
          return {
            id: file,
            filename: file,
            path: `/api/uploads/${encodeURIComponent(file)}`, // Use API route instead of static path
            title: extractedTitle || file.replace(/\.[^/.]+$/, ""),
            artist: artistInfo.artist || "Unbekannter Künstler",
            album: "Tanzen Musik Website",
            duration: 0,
            genre: "Dance",
            extractedTitle: extractedTitle,
            extractedArtist: artistInfo.artist,
            originalTitle: null,
            originalArtist: null
          };
        }
      })
    );
    
    return NextResponse.json(songs);
  } catch (error) {
    console.error("Failed to fetch songs:", error);
    return NextResponse.json(
      { error: "Failed to fetch songs" },
      { status: 500 }
    );
  }
}

// Hilfsfunktionen für Metadaten-Extraktion (kopiert aus upload/route.ts)
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