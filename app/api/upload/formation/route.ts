import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink, rename, readdir } from "fs/promises";
import path from "path";
import { getCurrentUser } from "../../../lib/auth";
import { musicValidationService } from "../../../lib/music-validation";
import { playlistService } from "../../../lib/playlist-service";
import { esvApiService } from "../../../lib/esv-api";
import { Song, Startgruppe, EsvTurnier } from "../../../types";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user || user.role !== 'formation') {
      return NextResponse.json(
        { error: 'Nur Formationen können Musik hochladen' }, 
        { status: 403 }
      );
    }

    // FormData verarbeiten
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const formationsnr = parseInt(formData.get("formationsnr") as string);
    const aufstellungsversion = parseInt(formData.get("aufstellungsversion") as string);
    const esvId = formData.get("esvId") as string;
    const password = formData.get("password") as string;
    
    // Grundvalidierung
    if (!file) {
      return NextResponse.json(
        { error: "Keine Datei hochgeladen" },
        { status: 400 }
      );
    }

    if (!formationsnr || !aufstellungsversion) {
      return NextResponse.json(
        { error: "Formationsnummer und Aufstellungsversion sind erforderlich" },
        { status: 400 }
      );
    }

    if (!esvId || !password) {
      return NextResponse.json(
        { error: "ESV-Zugangsdaten fehlen" },
        { status: 400 }
      );
    }

    // Dateityp validieren
    const validTypes = ["audio/mpeg", "audio/mp3", "audio/wav"];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isValidFile = validTypes.includes(file.type) || 
                       ['mp3', 'wav'].includes(fileExtension || '');
    
    if (!isValidFile) {
      return NextResponse.json(
        { error: "Nur MP3/WAV-Dateien erlaubt" },
        { status: 400 }
      );
    }

    // Temporäre Datei speichern für Validierung
    const tempDir = path.join(process.cwd(), "temp");
    await mkdir(tempDir, { recursive: true });
    
    const tempFilename = `temp_${Date.now()}_${file.name}`;
    const tempPath = path.join(tempDir, tempFilename);
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(tempPath, buffer);

    try {
      // Formation in ESV-API validieren
      const veranstaltungen = await esvApiService.getVeranstaltungen(esvId, password);
      
      let foundFormation = null;
      const relevantTurniere = [];
      let startgruppe: Startgruppe = 'Hauptgruppe'; // Default
      
      // Formation in Startlisten suchen
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
            
            // Turniere und Startgruppe ermitteln
            const turniere = await esvApiService.getTurniere(veranstaltung.id, esvId, password);
            
            for (const meldung of formation.meldungen) {
              const turnier = turniere.turniere.find((t: EsvTurnier) => t.id === meldung.turnierId);
              if (turnier && !meldung.startsperre) {
                startgruppe = turnier.startgruppe;
                relevantTurniere.push({
                  ...turnier,
                  startnummer: meldung.startNr,
                  veranstaltungId: veranstaltung.id
                });
              }
            }
            break;
          }
        } catch (error) {
          console.warn(`Fehler beim Laden der Startliste für Veranstaltung ${veranstaltung.id}:`, error);
        }
      }

      if (!foundFormation) {
        // Temp-Datei löschen
        await unlink(tempPath).catch(() => {});
        return NextResponse.json(
          { error: 'Formation mit den angegebenen Parametern nicht in aktuellen Startlisten gefunden' },
          { status: 404 }
        );
      }

      // Musik validieren
      const validationResult = await musicValidationService.validateMusicFile(
        tempPath,
        { formationsnr, aufstellungsversion },
        startgruppe
      );

      if (!validationResult.isValid) {
        // Temp-Datei löschen
        await unlink(tempPath).catch(() => {});
        return NextResponse.json(
          { 
            error: 'Musikdatei ist nicht gültig',
            details: validationResult.errors
          },
          { status: 400 }
        );
      }

      // Endgültigen Dateinamen generieren
      const uploadDir = path.join(process.cwd(), "public/uploads");
      await mkdir(uploadDir, { recursive: true });
      
      const finalFilename = musicValidationService.generateMusicFilename(
        file.name,
        formationsnr,
        aufstellungsversion,
        relevantTurniere[0]?.startnummer?.toString()
      );
      
      const finalPath = path.join(uploadDir, finalFilename);

      // MP3-Tags aktualisieren und Datei verschieben
      await musicValidationService.updateMp3Tags(
        tempPath,
        relevantTurniere[0]?.startnummer?.toString() || formationsnr.toString(),
        foundFormation.team.name,
        foundFormation.club.name
      );

      // Datei von temp nach uploads verschieben
      await rename(tempPath, finalPath);

      // Song-Objekt erstellen
      const song: Song = {
        id: `song_${Date.now()}_${formationsnr}_${aufstellungsversion}`,
        filename: finalFilename,
        path: `/uploads/${finalFilename}`,
        title: foundFormation.team.name,
        artist: foundFormation.club.name,
        album: foundFormation.team.name,
        duration: validationResult.duration,
        formationsnr,
        aufstellungsversion,
        startnummer: relevantTurniere[0]?.startnummer?.toString(),
        clubName: foundFormation.club.name,
        teamName: foundFormation.team.name,
        startgruppe,
        isValidDuration: true,
        extractedTitle: foundFormation.team.name,
        extractedArtist: foundFormation.club.name
      };

      // Song zu relevanten Playlists hinzufügen
      const playlistAssignments = [];
      for (const turnier of relevantTurniere) {
        try {
          song.esvTurnierId = turnier.id;
          const success = await playlistService.assignSongToPlaylist(song, turnier.id);
          playlistAssignments.push({
            turnierId: turnier.id,
            playlistName: esvApiService.createPlaylistName(turnier),
            success
          });
        } catch (error) {
          console.error(`Fehler beim Zuordnen zur Playlist ${turnier.id}:`, error);
          playlistAssignments.push({
            turnierId: turnier.id,
            playlistName: esvApiService.createPlaylistName(turnier),
            success: false,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler'
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: "Musik erfolgreich hochgeladen",
        song: {
          id: song.id,
          filename: song.filename,
          title: song.title,
          artist: song.artist,
          duration: song.duration,
          formationsnr: song.formationsnr,
          aufstellungsversion: song.aufstellungsversion,
          startnummer: song.startnummer,
          teamName: song.teamName,
          clubName: song.clubName,
          startgruppe: song.startgruppe
        },
        formation: {
          name: foundFormation.team.name,
          club: foundFormation.club.name,
          formationsnr,
          aufstellungsversion
        },
        playlists: playlistAssignments,
        validation: {
          startgruppe,
          durationValid: true,
          duration: validationResult.duration
        }
      });

    } catch (error) {
      // Temp-Datei aufräumen
      await unlink(tempPath).catch(() => {});
      
      console.error('Fehler beim Musik-Upload:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Zugangsdaten')) {
          return NextResponse.json(
            { error: 'ESV-Zugangsdaten sind nicht korrekt' },
            { status: 401 }
          );
        }
      }
      
      return NextResponse.json(
        { error: 'Fehler beim Verarbeiten der Musik' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Allgemeiner Upload-Fehler:', error);
    return NextResponse.json(
      { error: 'Unerwarteter Fehler beim Upload' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' }, 
        { status: 401 }
      );
    }

    // Liste der hochgeladenen Dateien zurückgeben
    const uploadsDir = path.join(process.cwd(), "public/uploads");
    
    try {
      const files = await readdir(uploadsDir);
      const audioFiles = files.filter((file: string) => 
        file.endsWith('.mp3') || file.endsWith('.wav')
      );

      return NextResponse.json({
        files: audioFiles,
        count: audioFiles.length
      });
    } catch {
      return NextResponse.json({
        files: [],
        count: 0
      });
    }

  } catch (error) {
    console.error('Fehler beim Laden der Upload-Liste:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Dateien' },
      { status: 500 }
    );
  }
}
