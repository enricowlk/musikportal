import { NextRequest, NextResponse } from 'next/server';
import { esvApiService } from '../../../lib/esv-api';
import { getCurrentUser } from '../../../lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user || (user.role !== 'admin' && user.role !== 'ausrichter')) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' }, 
        { status: 403 }
      );
    }

    // ESV-Credentials aus dem Request oder der User-Session holen
    const { searchParams } = new URL(request.url);
    const esvId = searchParams.get('esvId') || user.esvId;
    const password = searchParams.get('password'); // In Produktion sollte das sicher gespeichert werden
    
    if (!esvId || !password) {
      return NextResponse.json(
        { error: 'ESV-Zugangsdaten fehlen' }, 
        { status: 400 }
      );
    }

    const veranstaltungen = await esvApiService.getVeranstaltungen(esvId, password);
    
    // Für Ausrichter: Nur Veranstaltungen zurückgeben, bei denen sie Ausrichter sind
    if (user.role === 'ausrichter' && user.vereinId) {
      const filteredVeranstaltungen = esvApiService.filterVeranstaltungenNachAusrichter(
        veranstaltungen, 
        user.vereinId
      );
      return NextResponse.json(filteredVeranstaltungen);
    }

    // Für Admin: Alle Veranstaltungen
    return NextResponse.json(veranstaltungen);

  } catch (error) {
    console.error('Fehler beim Laden der ESV-Veranstaltungen:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Veranstaltungen' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Nur Administratoren können ESV-Daten synchronisieren' }, 
        { status: 403 }
      );
    }

    const { esvId, password, veranstaltungIds } = await request.json();
    
    if (!esvId || !password) {
      return NextResponse.json(
        { error: 'ESV-Zugangsdaten fehlen' }, 
        { status: 400 }
      );
    }

    const results = [];

    // Für jede Veranstaltung die Daten synchronisieren
    for (const veranstaltungId of veranstaltungIds || []) {
      try {
        // Turniere laden
        const turniere = await esvApiService.getTurniere(veranstaltungId, esvId, password);
        
        // Startliste laden
        const startliste = await esvApiService.getStartliste(veranstaltungId, esvId, password);
        
        // TODO: Daten in lokale Datenbank speichern
        // TODO: Playlists automatisch erstellen
        
        results.push({
          veranstaltungId,
          success: true,
          turniere: turniere.turniere.length,
          startliste: startliste.length
        });
      } catch (error) {
        results.push({
          veranstaltungId,
          success: false,
          error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
      }
    }

    return NextResponse.json({ results });

  } catch (error) {
    console.error('Fehler bei der ESV-Synchronisation:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Synchronisation' }, 
      { status: 500 }
    );
  }
}
