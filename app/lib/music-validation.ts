import { parseFile, IAudioMetadata } from 'music-metadata';
import { statSync } from 'fs';
import { Startgruppe, DurationLimits, FormationUploadParams, EsvStartliste } from '../types';

export class MusicValidationService {
  
  private static readonly DURATION_LIMITS: Record<Startgruppe, DurationLimits> = {
    'Kinder': { min: 150, max: 180 }, // 2:30 - 3:00 Minuten
    'Jugend': { min: 180, max: 240 }, // 3:00 - 4:00 Minuten
    'Hauptgruppe': { min: 180, max: 240 } // 3:00 - 4:00 Minuten
  };

  /**
   * Validiert eine Musikdatei basierend auf Startgruppe und anderen Parametern
   */
  static async validateMusicFile(
    filePath: string,
    params: FormationUploadParams,
    startgruppe: Startgruppe
  ): Promise<{
    isValid: boolean;
    errors: string[];
    metadata?: IAudioMetadata;
    duration?: number;
  }> {
    const errors: string[] = [];
    
    try {
      // Metadaten extrahieren
      const metadata = await parseFile(filePath);
      const duration = metadata.format.duration;

      if (!duration) {
        errors.push('Dateimetadaten konnten nicht gelesen werden');
        return { isValid: false, errors };
      }

      // Dateigröße prüfen (20MB Limit)
      const stats = statSync(filePath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      
      if (fileSizeInMB > 20) {
        errors.push('Datei ist zu groß (Maximum: 20MB)');
      }

      // Duration basierend auf Startgruppe validieren
      const limits = this.DURATION_LIMITS[startgruppe];
      if (duration < limits.min) {
        const minFormatted = this.formatDuration(limits.min);
        errors.push(`Titel ist zu kurz für Startgruppe "${startgruppe}" (Minimum: ${minFormatted})`);
      }
      
      if (duration > limits.max) {
        const maxFormatted = this.formatDuration(limits.max);
        errors.push(`Titel ist zu lang für Startgruppe "${startgruppe}" (Maximum: ${maxFormatted})`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        metadata,
        duration
      };

    } catch (error) {
      console.error('Fehler beim Validieren der Musikdatei:', error);
      errors.push('Datei kann nicht geöffnet werden. Ist die Datei wirklich eine Audio-Datei?');
      return { isValid: false, errors };
    }
  }

  /**
   * Modifiziert die MP3-Tags basierend auf Formation und Turnier-Daten
   */
  static async updateMp3Tags(
    filePath: string,
    startnummer: string,
    teamName: string,
    clubName: string
  ): Promise<void> {
    try {
      // Hier würde normalerweise eine Library wie node-id3 verwendet
      // Da wir die nicht installiert haben, bereiten wir die Struktur vor
      
      // TODO: npm install node-id3 hinzufügen
      console.log('MP3-Tags aktualisieren:', {
        title: startnummer,
        album: teamName,
        artist: clubName,
        file: filePath
      });

      // Beispiel-Implementation:
      // const NodeID3 = require('node-id3');
      // const tags = {
      //   title: startnummer,
      //   album: teamName,
      //   artist: clubName
      // };
      // NodeID3.update(tags, filePath);
      
    } catch (error) {
      console.error('Fehler beim Aktualisieren der MP3-Tags:', error);
      throw new Error('MP3-Tags konnten nicht aktualisiert werden');
    }
  }

  /**
   * Sucht Formation in der Startliste
   */
  static findFormationInStartliste(
    startliste: EsvStartliste,
    formationsnr: number,
    aufstellungsversion: number
  ): EsvStartliste[0] | null {
    return startliste.find(starter => 
      starter.formationsnr === formationsnr && 
      starter.aufstellungsversion === aufstellungsversion
    ) || null;
  }

  /**
   * Bestimmt die Startgruppe anhand der Formation in der API
   * @param formation - Formation data (currently unused, reserved for future implementation)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static getStartgruppeFromApi(formation: EsvStartliste[0]): Startgruppe {
    // TODO: Implementierung basierend auf tatsächlichen ESV-API-Daten
    // Die Startgruppe muss aus anderen Daten der Formation abgeleitet werden
    // z.B. aus dem Alter der Personen, der Turnier-Kategorie, etc.
    
    // Placeholder-Logik - muss angepasst werden wenn echte ESV-API verfügbar ist
    return 'Hauptgruppe';
  }

  /**
   * Formatiert Dauer in MM:SS Format
   */
  private static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Prüft ob eine Formation berechtigt ist, Musik hochzuladen
   */
  static validateFormationPermissions(
    _formation: EsvStartliste[0]
  ): { isValid: boolean; error?: string } {
    if (!_formation) {
      return { isValid: false, error: 'Formation nicht in der Startliste gefunden' };
    }

    // TODO: Weitere Berechtigungsprüfungen basierend auf User-Token
    // z.B. prüfen ob der User zu dem Verein der Formation gehört

    return { isValid: true };
  }

  /**
   * Erstellt einen eindeutigen Dateinamen für hochgeladene Musik
   */
  static generateMusicFilename(
    originalFilename: string,
    formationsnr: number,
    aufstellungsversion: number,
    startnummer?: string
  ): string {
    const timestamp = Date.now();
    const extension = originalFilename.split('.').pop();
    const prefix = startnummer ? `${startnummer}_` : '';
    return `${timestamp}_${prefix}F${formationsnr}_V${aufstellungsversion}.${extension}`;
  }

  /**
   * Bereinigt Dateinamen für sichere Speicherung
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-_]/g, '_')
      .replace(/_{2,}/g, '_')
      .trim();
  }
}

export const musicValidationService = MusicValidationService;
