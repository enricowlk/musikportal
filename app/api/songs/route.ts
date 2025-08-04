import { readdir } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

export async function GET() {
  const uploadDir = path.join(process.cwd(), "public/uploads");
  try {
    const files = await readdir(uploadDir);
    const songs = files
      .filter(file => file.match(/\.(mp3|wav)$/i))
      .map(file => ({
        id: file,
        filename: file,
        path: `/uploads/${file}`
      }));
    return NextResponse.json(songs);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}