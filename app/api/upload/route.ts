// app/api/upload/route.ts
import { writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

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

    // Upload-Verzeichnis erstellen
    const uploadDir = path.join(process.cwd(), "public/uploads");
    await mkdir(uploadDir, { recursive: true });

    // Datei speichern (mit Timestamp im Namen)
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name.replace(/\s+/g, "_")}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      filename: filename,
      path: `/uploads/${filename}`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Serverfehler beim Upload" },
      { status: 500 }
    );
  }
}

// Hilfsfunktion für Verzeichnis-Erstellung
async function mkdir(dir: string, options?: any) {
  const { mkdir } = await import("fs/promises");
  return mkdir(dir, options).catch((e) => {
    if (e.code !== "EEXIST") throw e;
  });
}