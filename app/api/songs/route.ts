// app/api/songs/route.ts
import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

const UPLOADS_DIR = path.join(process.cwd(), "public/uploads");

export async function GET() {
  try {
    const files = await fs.readdir(UPLOADS_DIR);
    const songs = files.map(file => ({
      id: file,
      filename: file,
      path: `/uploads/${file}`,
      title: file.replace(/\.[^/.]+$/, ""), // Entfernt Dateierweiterung
    }));
    return NextResponse.json(songs);
  } catch (error) {
    console.error("Failed to fetch songs:", error); // Now the error is used
    return NextResponse.json(
      { error: "Failed to fetch songs" },
      { status: 500 }
    );
  }
}