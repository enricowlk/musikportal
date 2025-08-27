// app/api/playlists/[id]/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { parseBuffer } from "music-metadata";
import { getCurrentUser } from "../../../../lib/auth";
import { playlistService } from "../../../../lib/playlist-service";

interface Song {
  id: string;
  path: string;
  filename: string;
  title: string;
  artist: string;
  duration: number;
  album?: string;
}

interface Playlist {
  id: string;
  name: string;
  songIds: string[];
  createdBy?: string;
  turnierId?: string;
}

const DB_PATH = path.join(process.cwd(), "data/playlists.json");

// Hilfsfunktionen für Metadaten-Extraktion (aus songs/route.ts)
function extractTitleFromFilename(filename: string): string {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  const timestampPattern = /^\d{13}_/;
  let cleanName = nameWithoutExt.replace(timestampPattern, "");
  
  // Ersetze Unterstriche durch Leerzeichen
  cleanName = cleanName.replace(/_/g, " ");
  
  // Entferne [Brackets] und (Parentheses) am Ende
  cleanName = cleanName.replace(/\s*[\[\(].*?[\]\)]\s*$/g, "");
  
  return cleanName.trim();
}

function extractArtistFromFilename(filename: string): { artist: string } {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  const timestampPattern = /^\d{13}_/;
  let cleanName = nameWithoutExt.replace(timestampPattern, "");
  
  cleanName = cleanName.replace(/_/g, " ");
  
  // Suche nach " - " Pattern für Künstler - Titel
  const dashMatch = cleanName.match(/^(.+?)\s+-\s+(.+)/);
  if (dashMatch) {
    return { artist: dashMatch[1].trim() };
  }
  
  // Suche nach "x" oder "ft." oder "feat." für Features
  const featureMatch = cleanName.match(/^(.+?)\s+(?:x|ft\.|feat\.)\s+/i);
  if (featureMatch) {
    return { artist: featureMatch[1].trim() };
  }
  
  return { artist: "Unbekannter Künstler" };
}

async function getSongDetails(songId: string): Promise<Song | null> {
  try {
    const uploadsPath = path.resolve(process.cwd(), "public", "uploads");
    const filePath = path.resolve(uploadsPath, songId);
    
    // Prüfe ob Datei existiert
    await fs.access(filePath);
    
    const fileBuffer = await fs.readFile(filePath);
    const metadata = await parseBuffer(fileBuffer);
    
    const extractedTitle = extractTitleFromFilename(songId);
    const artistInfo = extractArtistFromFilename(songId);
    
    return {
      id: songId,
      filename: songId,
      path: `/uploads/${songId}`,
      title: metadata.common.title || extractedTitle || songId.replace(/\.[^/.]+$/, ""),
      artist: metadata.common.artist || artistInfo.artist || "Unbekannter Künstler",
      album: metadata.common.album || "Tanzen Musik Website",
      duration: metadata.format?.duration || 0
    };
  } catch (error) {
    console.warn(`Could not get details for song ${songId}:`, error);
    return null;
  }
}

function generateM3U(playlistName: string, songs: Song[], baseUrl: string): string {
  let m3u = "#EXTM3U\n";
  m3u += `#PLAYLIST:${playlistName}\n\n`;
  
  for (const song of songs) {
    const durationSeconds = Math.round(song.duration);
    m3u += `#EXTINF:${durationSeconds},${song.artist} - ${song.title}\n`;
    m3u += `${baseUrl}${song.path}\n\n`;
  }
  
  return m3u;
}

function generateXML(playlistName: string, songs: Song[], baseUrl: string): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n';
  xml += '<plist version="1.0">\n';
  xml += '<dict>\n';
  xml += '  <key>Major Version</key><integer>1</integer>\n';
  xml += '  <key>Minor Version</key><integer>1</integer>\n';
  xml += '  <key>Date</key><date>' + new Date().toISOString() + '</date>\n';
  xml += '  <key>Application Version</key><string>Tanzen Musik Website</string>\n';
  xml += '  <key>Features</key><integer>5</integer>\n';
  xml += '  <key>Show Content Ratings</key><true/>\n';
  xml += '  <key>Music Folder</key><string>file://localhost/Music/</string>\n';
  xml += '  <key>Library Persistent ID</key><string>TMW001</string>\n';
  xml += '  <key>Tracks</key>\n';
  xml += '  <dict>\n';
  
  // Tracks hinzufügen
  songs.forEach((song, index) => {
    const trackId = index + 1;
    xml += `    <key>${trackId}</key>\n`;
    xml += '    <dict>\n';
    xml += `      <key>Track ID</key><integer>${trackId}</integer>\n`;
    xml += `      <key>Name</key><string>${escapeXML(song.title)}</string>\n`;
    xml += `      <key>Artist</key><string>${escapeXML(song.artist)}</string>\n`;
    xml += `      <key>Album</key><string>${escapeXML(song.album || "Tanzen Musik Website")}</string>\n`;
    xml += `      <key>Genre</key><string>Dance</string>\n`;
    xml += `      <key>Kind</key><string>MPEG audio file</string>\n`;
    xml += `      <key>Size</key><integer>0</integer>\n`;
    xml += `      <key>Total Time</key><integer>${Math.round((song.duration || 0) * 1000)}</integer>\n`;
    xml += `      <key>Track Number</key><integer>${trackId}</integer>\n`;
    xml += `      <key>Year</key><integer>${new Date().getFullYear()}</integer>\n`;
    xml += `      <key>Date Modified</key><date>${new Date().toISOString()}</date>\n`;
    xml += `      <key>Date Added</key><date>${new Date().toISOString()}</date>\n`;
    xml += `      <key>Bit Rate</key><integer>320</integer>\n`;
    xml += `      <key>Sample Rate</key><integer>44100</integer>\n`;
    xml += `      <key>Location</key><string>${baseUrl}${song.path}</string>\n`;
    xml += `      <key>File Folder Count</key><integer>5</integer>\n`;
    xml += `      <key>Library Folder Count</key><integer>1</integer>\n`;
    xml += '    </dict>\n';
  });
  
  xml += '  </dict>\n';
  xml += '  <key>Playlists</key>\n';
  xml += '  <array>\n';
  xml += '    <dict>\n';
  xml += `      <key>Name</key><string>${escapeXML(playlistName)}</string>\n`;
  xml += '      <key>Master</key><true/>\n';
  xml += `      <key>Playlist ID</key><integer>100</integer>\n`;
  xml += `      <key>Playlist Persistent ID</key><string>TMW${Date.now()}</string>\n`;
  xml += '      <key>Visible</key><true/>\n';
  xml += '      <key>All Items</key><true/>\n';
  xml += '    </dict>\n';
  xml += '    <dict>\n';
  xml += `      <key>Name</key><string>${escapeXML(playlistName)}</string>\n`;
  xml += `      <key>Playlist ID</key><integer>200</integer>\n`;
  xml += `      <key>Playlist Persistent ID</key><string>TMW${Date.now()}P</string>\n`;
  xml += '      <key>Playlist Items</key>\n';
  xml += '      <array>\n';
  
  // Playlist Items hinzufügen
  songs.forEach((_, index) => {
    const trackId = index + 1;
    xml += '        <dict>\n';
    xml += `          <key>Track ID</key><integer>${trackId}</integer>\n`;
    xml += '        </dict>\n';
  });
  
  xml += '      </array>\n';
  xml += '    </dict>\n';
  xml += '  </array>\n';
  xml += '</dict>\n';
  xml += '</plist>\n';
  
  return xml;
}

function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'm3u';
    
    // Prüfe Berechtigung mit erweiterter Auth
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'ausrichter')) {
      return NextResponse.json({ error: "Nicht autorisiert für Playlist-Export" }, { status: 403 });
    }
    
    // Versuche zuerst ESV-Integration (neue Playlist-Service)
    try {
      const m3uContent = await playlistService.exportPlaylistAsM3U(id);
      
      if (format === 'm3u') {
        const safePlaylistName = `playlist_${id}`;
        const filename = `${safePlaylistName}.m3u`;
        
        return new NextResponse(m3uContent, {
          headers: {
            'Content-Type': 'audio/x-mpegurl',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-cache'
          }
        });
      }
    } catch (esvError) {
      console.log('ESV-Playlist nicht gefunden, verwende Legacy-System:', esvError);
    }
    
    // Fallback auf Legacy-System
    // Playlist laden
    const playlistData = await fs.readFile(DB_PATH, "utf-8");
    const playlists: Playlist[] = JSON.parse(playlistData);
    
    const playlist = playlists.find(p => p.id === id);
    if (!playlist) {
      return NextResponse.json({ error: "Playlist nicht gefunden" }, { status: 404 });
    }
    
    // Songs laden
    const songs: Song[] = [];
    for (const songId of playlist.songIds) {
      const songDetails = await getSongDetails(songId);
      if (songDetails) {
        songs.push(songDetails);
      }
    }
    
    // Base URL für absolute Links
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    
    let content: string;
    let mimeType: string;
    let fileExtension: string;
    
    if (format === 'xml') {
      content = generateXML(playlist.name, songs, baseUrl);
      mimeType = 'application/xml';
      fileExtension = 'xml';
    } else {
      content = generateM3U(playlist.name, songs, baseUrl);
      mimeType = 'audio/x-mpegurl';
      fileExtension = 'm3u';
    }
    
    // Dateiname erstellen (bereinigt für Dateisystem)
    const safePlaylistName = playlist.name.replace(/[^a-zA-Z0-9\-_\s]/g, '').replace(/\s+/g, '_');
    const filename = `${safePlaylistName}.${fileExtension}`;
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error("Fehler beim Exportieren der Playlist:", error);
    return NextResponse.json(
      { error: "Export fehlgeschlagen" },
      { status: 500 }
    );
  }
}
