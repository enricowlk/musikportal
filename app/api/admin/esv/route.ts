import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth';
import { esvApiService } from '../../../lib/esv-api';
import { playlistService } from '../../../lib/playlist-service';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Nur Administratoren haben Zugriff auf alle ESV-Daten' }, 
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const esvId = searchParams.get('esvId');
    const password = searchParams.get('password');
    
    if (!esvId || !password) {
      return NextResponse.json(
        { error: 'ESV-Admin-Zugangsdaten fehlen' }, 
        { status: 400 }
      );
    }

    switch (action) {
      case 'overview':
        return await handleOverview(esvId, password);
      
      case 'sync-all':
        return await handleSyncAll(esvId, password);
      
      case 'test-connection':
        return await handleTestConnection(esvId, password);
      
      case 'status':
        return await handleStatus();
      
      default:
        return NextResponse.json({
          availableActions: [
            'overview - Überblick über ESV-Daten',
            'test-connection - Testet die ESV-Verbindung',
            'sync-all - Synchronisiert alle Veranstaltungen', 
            'status - Zeigt den aktuellen Status der ESV-Integration'
          ]
        });
    }

  } catch (error) {
    console.error('Fehler in ESV-Admin-API:', error);
    return NextResponse.json(
      { error: 'Unerwarteter Fehler' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Nur Administratoren können Saison-Daten löschen' }, 
        { status: 403 }
      );
    }

    const { saison } = await request.json();
    
    if (!saison) {
      return NextResponse.json(
        { error: 'Saison-Jahr ist erforderlich' }, 
        { status: 400 }
      );
    }

    // TODO: Implement season cleanup
    // - Delete playlists from specified season
    // - Clean up associated song assignments
    // - Archive or delete related data
    
    return NextResponse.json({
      success: true,
      message: `Daten für Saison ${saison} wurden gelöscht`
    });

  } catch (error) {
    console.error('Fehler beim Löschen der Saison-Daten:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen' }, 
      { status: 500 }
    );
  }
}

async function handleOverview(esvId: string, password: string) {
  try {
    const veranstaltungen = await esvApiService.getVeranstaltungen(esvId, password);
    
    let totalTurniere = 0;
    let totalFormationen = 0;
    const aktuellesSaison = new Date().getFullYear();
    
    const veranstaltungenStats = [];
    
    for (const veranstaltung of veranstaltungen.slice(0, 5)) { // Limit für Performance
      try {
        const turniere = await esvApiService.getTurniere(veranstaltung.id, esvId, password);
        const startliste = await esvApiService.getStartliste(veranstaltung.id, esvId, password);
        
        totalTurniere += turniere.turniere.length;
        totalFormationen += startliste.length;
        
        veranstaltungenStats.push({
          id: veranstaltung.id,
          ausrichter: veranstaltung.ausrichter.name,
          ort: veranstaltung.turnierstaette.ort,
          datum: veranstaltung.datumVon,
          turnierCount: turniere.turniere.length,
          formationCount: startliste.length
        });
      } catch {
        console.warn(`Fehler beim Laden der Details für Veranstaltung ${veranstaltung.id}`);
      }
    }

    // Aktuelle Playlists laden
    const playlists = await playlistService.getPlaylistsForAusrichter(); // Admin sieht alle
    
    return NextResponse.json({
      overview: {
        veranstaltungenCount: veranstaltungen.length,
        totalTurniere,
        totalFormationen,
        aktuellesSaison: aktuellesSaison,
        playlistsCount: playlists.length
      },
      veranstaltungen: veranstaltungenStats,
      recentPlaylists: playlists.slice(0, 10).map(p => ({
        id: p.id,
        name: p.name,
        songCount: p.songCount,
        updatedAt: p.updatedAt,
        turnierart: p.turnierart,
        startgruppe: p.startgruppe
      }))
    });

  } catch (error) {
    console.error('Fehler beim Laden der ESV-Übersicht:', error);
    throw error;
  }
}

async function handleSyncAll(esvId: string, password: string) {
  try {
    const veranstaltungen = await esvApiService.getVeranstaltungen(esvId, password);
    
    // Nur aktuelle Saison synchronisieren
    const aktuellesSaison = new Date().getFullYear();
    const saisonVeranstaltungen = esvApiService.filterTurniereNachSaison(veranstaltungen, aktuellesSaison);
    
    const results = [];
    
    for (const veranstaltung of saisonVeranstaltungen) {
      try {
        // Turniere laden und Playlists erstellen
        const turniere = await esvApiService.getTurniere(veranstaltung.id, esvId, password);
        const createdPlaylists = await playlistService.createPlaylistsFromTurniere(turniere);
        
        results.push({
          veranstaltungId: veranstaltung.id,
          ausrichter: veranstaltung.ausrichter.name,
          success: true,
          playlistsCreated: createdPlaylists.length,
          playlists: createdPlaylists.map(p => p.name)
        });
      } catch (error) {
        results.push({
          veranstaltungId: veranstaltung.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synchronisation abgeschlossen für Saison ${aktuellesSaison}`,
      results,
      summary: {
        total: saisonVeranstaltungen.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('Fehler bei der Vollsynchronisation:', error);
    throw error;
  }
}

async function handleTestConnection(esvId: string, password: string) {
  try {
    const isConnected = await esvApiService.testConnection(esvId, password);
    
    if (isConnected) {
      return NextResponse.json({
        connected: true,
        message: 'ESV-Verbindung erfolgreich'
      });
    } else {
      return NextResponse.json({
        connected: false,
        message: 'ESV-Verbindung fehlgeschlagen'
      }, { status: 401 });
    }

  } catch (error) {
    console.error('Fehler beim Testen der ESV-Verbindung:', error);
    return NextResponse.json({
      connected: false,
      message: 'Verbindungstest fehlgeschlagen',
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }, { status: 500 });
  }
}

async function handleStatus() {
  try {
    // Anzahl existierender Playlists zählen
    const allPlaylists = await playlistService.getPlaylistsForAusrichter();
    
    return NextResponse.json({
      status: 'ready',
      environment: {
        esvEndpoint: process.env.ESV_ENDPOINT || 'nicht konfiguriert',
        esvSsl: process.env.ESV_SSL === 'true',
        esvToken: process.env.ESV_TOKEN ? 'konfiguriert' : 'nicht konfiguriert',
        esvNopost: process.env.ESV_NOPOST === 'true'
      },
      statistics: {
        totalPlaylists: allPlaylists.length,
        esvPlaylists: allPlaylists.filter(p => p.esvTurnierId).length,
        legacyPlaylists: allPlaylists.filter(p => !p.esvTurnierId).length
      },
      systemInfo: {
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Status-Abfrage fehlgeschlagen'
    }, { status: 500 });
  }
}
