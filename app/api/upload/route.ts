// app/api/upload/route.ts
import { writeFile, mkdir as fsMkdir } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import { parseBuffer } from "music-metadata";

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

    // Audio-Metadaten validieren
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
      path: `/uploads/${encodeURIComponent(filename)}`, // Enkodiere Dateinamen für URL-Sicherheit
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Serverfehler beim Upload" },
      { status: 500 }
    );
  }
}

// Type-safe Hilfsfunktion für Verzeichnis-Erstellung
async function mkdir(dir: string, options?: MkdirOptions) {
  return fsMkdir(dir, options).catch((e: NodeJS.ErrnoException) => {
    if (e.code !== "EEXIST") throw e;
  });
}