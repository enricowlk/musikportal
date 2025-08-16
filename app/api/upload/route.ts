// app/api/upload/route.ts
import { writeFile, mkdir as fsMkdir } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import { parseBuffer } from "music-metadata";
import { readdir, stat } from "fs/promises";

interface MkdirOptions {
  recursive?: boolean;
  mode?: number;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Keine Datei hochgeladen" },
        { status: 400 }
      );
    }

    // Dateityp validieren
    const validTypes = ["audio/mpeg", "audio/wav"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Nur MP3/WAV erlaubt" },
        { status: 400 }
      );
    }

    // Dateigröße validieren (max 20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Datei ist zu groß (max. 20MB)" },
        { status: 400 }
      );
    }

    // Upload-Verzeichnis erstellen
    const uploadDir = path.join(process.cwd(), "public/uploads");
    await mkdir(uploadDir, { recursive: true });

    // Datei speichern (mit Timestamp im Namen)
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name.replace(/\s+/g, "_")}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Audio-Metadaten analysieren und erweitern
    let enhancedMetadata;
    try {
      const metadata = await parseBuffer(buffer, { mimeType: file.type });
      
      // Überprüfen ob es wirklich eine Audio-Datei ist
      if (!metadata.format || !metadata.format.duration) {
        return NextResponse.json(
          { error: "Datei kann nicht als Audio-Datei gelesen werden" },
          { status: 400 }
        );
      }

      // Optional: Länge validieren (z.B. max 10 Minuten)
      const maxDuration = 10 * 60; // 10 Minuten in Sekunden
      if (metadata.format.duration > maxDuration) {
        return NextResponse.json(
          { error: "Audio-Datei ist zu lang (max. 10 Minuten)" },
          { status: 400 }
        );
      }

      // Intelligente Titel-Extraktion aus Dateinamen
      const extractedTitle = extractTitleFromFilename(file.name);
      const artistInfo = extractArtistFromFilename(file.name);

      // Erweiterte Metadaten erstellen
      enhancedMetadata = {
        originalTitle: metadata.common.title || null,
        extractedTitle: extractedTitle,
        originalArtist: metadata.common.artist || null,
        extractedArtist: artistInfo.artist,
        extractedTrack: artistInfo.track,
        album: metadata.common.album || "Tanzen Musik Website",
        duration: metadata.format.duration,
        bitrate: metadata.format.bitrate,
        sampleRate: metadata.format.sampleRate,
        channels: metadata.format.numberOfChannels,
        genre: metadata.common.genre?.[0] || "Dance",
        year: metadata.common.year || new Date().getFullYear()
      };

      // Duplikats-Erkennung vor dem Speichern
      const duplicateCheck = await checkForDuplicates(enhancedMetadata, uploadDir);
      if (duplicateCheck.isDuplicate) {
        return NextResponse.json(
          { 
            error: "Duplikat gefunden", 
            message: `Eine ähnliche Datei existiert bereits: "${duplicateCheck.similarFile}"`,
            similarFile: duplicateCheck.similarFile,
            similarity: duplicateCheck.similarity,
            duplicateType: duplicateCheck.duplicateType
          },
          { status: 409 } // Conflict status
        );
      }

    } catch (error) {
      console.error("Metadata parsing failed:", error);
      return NextResponse.json(
        { error: "Datei ist keine gültige Audio-Datei" },
        { status: 400 }
      );
    }

    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      filename: filename,
      path: `/uploads/${encodeURIComponent(filename)}`,
      metadata: enhancedMetadata, // Metadaten mit zurückgeben
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Serverfehler beim Upload" },
      { status: 500 }
    );
  }
}

// Intelligente Titel-Extraktion aus Dateinamen
function extractTitleFromFilename(filename: string): string {
  // Entferne Dateierweiterung
  let title = filename.replace(/\.(mp3|wav|m4a|flac)$/i, '');
  
  // Entferne Timestamp am Anfang (z.B. "1754231974925_")
  title = title.replace(/^\d+_/, '');
  
  // Ersetze Unterstriche und Bindestriche durch Leerzeichen
  title = title.replace(/[_-]+/g, ' ');
  
  // Entferne überflüssige Leerzeichen
  title = title.replace(/\s+/g, ' ').trim();
  
  // Kapitalisierung: Erster Buchstabe jedes Wortes groß
  title = title.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return title || 'Unbekannter Titel';
}

// Künstler-Extraktion aus Dateinamen
function extractArtistFromFilename(filename: string): { artist: string; track: string } {
  let cleanName = filename.replace(/\.(mp3|wav|m4a|flac)$/i, '');
  cleanName = cleanName.replace(/^\d+_/, '');
  
  // Verschiedene Trennzeichen für Künstler - Titel
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
  
  // Fallback: Ganzer Name als Titel, Künstler unbekannt
  return {
    artist: 'Unbekannter Künstler',
    track: formatName(cleanName.replace(/[_-]/g, ' '))
  };
}

// Name-Formatierung
function formatName(name: string): string {
  return name.replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Type-safe Hilfsfunktion für Verzeichnis-Erstellung
async function mkdir(dir: string, options?: MkdirOptions) {
  return fsMkdir(dir, options).catch((e: NodeJS.ErrnoException) => {
    if (e.code !== "EEXIST") throw e;
  });
}

// Duplikats-Erkennung basierend auf Metadaten
interface DuplicateCheckResult {
  isDuplicate: boolean;
  similarFile?: string;
  similarity?: number;
  duplicateType?: 'exact' | 'similar' | 'duration';
}

interface AudioMetadata {
  originalTitle?: string | null;
  extractedTitle: string;
  originalArtist?: string | null;
  extractedArtist: string;
  extractedTrack: string;
  album: string;
  duration: number;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  genre: string;
  year: number;
}

async function checkForDuplicates(
  newMetadata: AudioMetadata, 
  uploadDir: string
): Promise<DuplicateCheckResult> {
  try {
    // Alle existierenden Audio-Dateien auflisten
    const existingFiles = await readdir(uploadDir);
    const audioFiles = existingFiles.filter(file => 
      /\.(mp3|wav|m4a|flac)$/i.test(file)
    );

    if (audioFiles.length === 0) {
      return { isDuplicate: false };
    }

    // Jede existierende Datei überprüfen
    for (const existingFile of audioFiles) {
      const filePath = path.join(uploadDir, existingFile);
      
      try {
        // Metadaten der existierenden Datei lesen
        const fileBuffer = await import('fs/promises').then(fs => fs.readFile(filePath));
        const existingMetadata = await parseBuffer(fileBuffer);

        if (!existingMetadata.format) continue;

        // Extrahierte Metadaten für Vergleich erstellen
        const existingExtracted = {
          title: extractTitleFromFilename(existingFile),
          artist: extractArtistFromFilename(existingFile).artist,
          originalTitle: existingMetadata.common.title,
          originalArtist: existingMetadata.common.artist,
          duration: existingMetadata.format.duration || 0
        };

        // 1. Exakter Match: Titel + Künstler identisch
        const exactMatch = checkExactMatch(newMetadata, existingExtracted);
        if (exactMatch) {
          return {
            isDuplicate: true,
            similarFile: existingFile,
            similarity: 100,
            duplicateType: 'exact'
          };
        }

        // 2. Ähnlichkeits-Check: Titel und Künstler ähnlich
        const similarity = calculateSimilarity(newMetadata, existingExtracted);
        if (similarity > 0.85) { // 85% Ähnlichkeit
          return {
            isDuplicate: true,
            similarFile: existingFile,
            similarity: Math.round(similarity * 100),
            duplicateType: 'similar'
          };
        }

        // 3. Dauer-basierte Erkennung: Sehr ähnliche Dauer (±3 Sekunden)
        const durationDiff = Math.abs(newMetadata.duration - existingExtracted.duration);
        if (durationDiff <= 3 && similarity > 0.7) {
          return {
            isDuplicate: true,
            similarFile: existingFile,
            similarity: Math.round(similarity * 100),
            duplicateType: 'duration'
          };
        }

      } catch (fileError) {
        console.warn(`Could not process file ${existingFile}:`, fileError);
        continue;
      }
    }

    return { isDuplicate: false };

  } catch (error) {
    console.error("Duplicate check failed:", error);
    return { isDuplicate: false }; // Bei Fehlern nicht blockieren
  }
}

// Exakter Match-Check
function checkExactMatch(
  newMetadata: AudioMetadata, 
  existingMetadata: any
): boolean {
  // Normalisiere Strings für Vergleich
  const normalize = (str: string | null | undefined): string => {
    if (!str) return '';
    return str.toLowerCase()
      .replace(/[^\w\s]/g, '') // Sonderzeichen entfernen
      .replace(/\s+/g, ' ')     // Mehrfach-Leerzeichen
      .trim();
  };

  const newTitle = normalize(newMetadata.extractedTitle || newMetadata.originalTitle);
  const newArtist = normalize(newMetadata.extractedArtist || newMetadata.originalArtist);

  const existingTitle = normalize(existingMetadata.title || existingMetadata.originalTitle);
  const existingArtist = normalize(existingMetadata.artist || existingMetadata.originalArtist);

  return newTitle === existingTitle && newArtist === existingArtist;
}

// Ähnlichkeits-Berechnung (Levenshtein + Weighted)
function calculateSimilarity(
  newMetadata: AudioMetadata, 
  existingMetadata: any
): number {
  const titleSimilarity = stringSimilarity(
    newMetadata.extractedTitle || newMetadata.originalTitle || '',
    existingMetadata.title || existingMetadata.originalTitle || ''
  );

  const artistSimilarity = stringSimilarity(
    newMetadata.extractedArtist || newMetadata.originalArtist || '',
    existingMetadata.artist || existingMetadata.originalArtist || ''
  );

  // Gewichtung: Titel 60%, Künstler 40%
  return (titleSimilarity * 0.6) + (artistSimilarity * 0.4);
}

// String-Ähnlichkeit mit Levenshtein-Distanz
function stringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  // Normalisierung
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(s1, s2);
  return 1 - (distance / maxLen);
}

// Levenshtein-Distanz Algorithmus
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => 
    Array(str1.length + 1).fill(null)
  );

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}