// app/api/uploads/[filename]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

// Disable caching for this API route to always serve fresh files
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Sicherheitscheck: Keine Pfad-Traversal-Angriffe
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }
    
    // Production-safe path resolution
    const filePath = path.resolve(process.cwd(), 'public', 'uploads', filename);
    
    // Prüfe ob die Datei existiert
    try {
      await fs.access(filePath);
    } catch {
      console.error(`File not found: ${filePath}`);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Lese die Datei
    const fileBuffer = await fs.readFile(filePath);
    
    // Bestimme den Content-Type basierend auf der Dateiendung
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.mp3':
        contentType = 'audio/mpeg';
        break;
      case '.wav':
        contentType = 'audio/wav';
        break;
      case '.m4a':
        contentType = 'audio/mp4';
        break;
      case '.flac':
        contentType = 'audio/flac';
        break;
      case '.ogg':
        contentType = 'audio/ogg';
        break;
    }
    
    // Headers für Audio-Streaming setzen
    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Length': fileBuffer.length.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    // Handle Range-Requests für Audio-Streaming
    const range = request.headers.get('range');
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileBuffer.length - 1;
      const chunksize = (end - start) + 1;
      const chunk = fileBuffer.slice(start, end + 1);
      
      return new NextResponse(chunk, {
        status: 206,
        headers: {
          ...Object.fromEntries(headers),
          'Content-Range': `bytes ${start}-${end}/${fileBuffer.length}`,
          'Content-Length': chunksize.toString(),
        }
      });
    }
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });
    
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
