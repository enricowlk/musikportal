import { NextRequest, NextResponse } from 'next/server';
import { esvApiService } from '../../../lib/esv-api';
import { musicValidationService } from '../../../lib/music-validation';
import { getCurrentUser } from '../../../lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user || user.role !== 'formation') {
      return NextResponse.json(
        { error: 'Nur Formationen können Upload-Parameter validieren' }, 
        { status: 403 }
      );
    }

    const { formationsnr, aufstellungsversion, esvId, password } = await request.json();
    
    if (!formationsnr || !aufstellungsversion) {
      return NextResponse.json(
        { error: 'Formationsnummer und Aufstellungsversion sind erforderlich' }, 
        { status: 400 }
      );
    }

    if (!esvId || !password) {
      return NextResponse.json(
        { error: 'ESV-Zugangsdaten fehlen' }, 
        { status: 400 }
      );
    }

    // TODO: In einem echten System würden die ESV-Credentials sicher gespeichert werden
    // und nicht bei jeder Anfrage übertragen
    
    try {
      // Aktuelle Veranstaltungen laden um relevante Startlisten zu finden
      const veranstaltungen = await esvApiService.getVeranstaltungen(esvId, password);
      
      let foundFormation = null;
      const relevantTurniere = [];
      
      // Durch alle Veranstaltungen iterieren um die Formation zu finden
      for (const veranstaltung of veranstaltungen) {
        try {
          const startliste = await esvApiService.getStartliste(veranstaltung.id, esvId, password);
          
          const formation = musicValidationService.findFormationInStartliste(
            startliste, 
            formationsnr, 
            aufstellungsversion
          );
          
          if (formation) {
            foundFormation = formation;
            
            // Relevante Turniere für diese Formation finden
            const turniere = await esvApiService.getTurniere(veranstaltung.id, esvId, password);
            
            // Turniere filtern, in denen die Formation gemeldet ist
            for (const meldung of formation.meldungen) {
              const turnier = turniere.turniere.find(t => t.id === meldung.turnierId);
              if (turnier && !meldung.startsperre) {
                relevantTurniere.push({
                  ...turnier,
                  startnummer: meldung.startNr,
                  veranstaltungId: veranstaltung.id,
                  veranstaltungName: `${veranstaltung.ausrichter.name} - ${veranstaltung.turnierstaette.ort}`
                });
              }
            }
            
            break; // Formation gefunden, weitere Suche nicht nötig
          }
        } catch (error) {
          // Einzelne Veranstaltung überspringen wenn Fehler
          console.warn(`Fehler beim Laden der Startliste für Veranstaltung ${veranstaltung.id}:`, error);
          continue;
        }
      }
      
      if (!foundFormation) {
        return NextResponse.json(
          { 
            error: 'Formation mit den angegebenen Parametern nicht in aktuellen Startlisten gefunden',
            found: false
          }, 
          { status: 404 }
        );
      }

      // Berechtigungen prüfen
      const permissionCheck = musicValidationService.validateFormationPermissions(foundFormation);
      
      if (!permissionCheck.isValid) {
        return NextResponse.json(
          { error: permissionCheck.error }, 
          { status: 403 }
        );
      }

      // Erfolgreich validiert
      return NextResponse.json({
        found: true,
        formation: {
          formationsnr: foundFormation.formationsnr,
          aufstellungsversion: foundFormation.aufstellungsversion,
          teamName: foundFormation.team.name,
          clubName: foundFormation.club.name,
          clubId: foundFormation.club.id
        },
        turniere: relevantTurniere.map(t => ({
          id: t.id,
          name: esvApiService.createPlaylistName(t),
          startgruppe: t.startgruppe,
          turnierart: t.turnierart,
          startnummer: t.startnummer,
          veranstaltung: t.veranstaltungName,
          datum: t.datumVon
        }))
      });

    } catch (error) {
      console.error('Fehler bei der Formation-Validierung:', error);
      
      if (error instanceof Error && error.message.includes('Zugangsdaten')) {
        return NextResponse.json(
          { error: 'ESV-Zugangsdaten sind nicht korrekt' }, 
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: 'Fehler beim Validieren der Formation' }, 
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Allgemeiner Fehler bei Formation-Validierung:', error);
    return NextResponse.json(
      { error: 'Unerwarteter Fehler' }, 
      { status: 500 }
    );
  }
}
