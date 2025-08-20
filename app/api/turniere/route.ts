// app/api/turniere/route.ts
import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

interface Turnier {
  id: string;
  name: string;
  datum: string;
  ort: string;
  ausrichter: string;
  status: 'anstehend' | 'laufend' | 'abgeschlossen';
  beschreibung?: string;
}

const DB_PATH = path.join(process.cwd(), "data/turniere.json");

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    
    const data = await fs.readFile(DB_PATH, "utf-8");
    let turniere: Turnier[] = JSON.parse(data);
    
    // Filter nach Status
    if (status) {
      turniere = turniere.filter(t => t.status === status);
    }
    
    // Filter nach Suchbegriff
    if (search) {
      const searchLower = search.toLowerCase();
      turniere = turniere.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.ort.toLowerCase().includes(searchLower) ||
        t.ausrichter.toLowerCase().includes(searchLower)
      );
    }
    
    // Sortiere nach Datum (anstehende zuerst)
    turniere.sort((a, b) => {
      if (a.status === 'anstehend' && b.status !== 'anstehend') return -1;
      if (b.status === 'anstehend' && a.status !== 'anstehend') return 1;
      return new Date(a.datum).getTime() - new Date(b.datum).getTime();
    });
    
    return NextResponse.json(turniere);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Turniere konnten nicht geladen werden", details: errorMessage },
      { status: 500 }
    );
  }
}
