import { EsvVeranstaltung, EsvStartliste, EsvTurnier } from '../types';

export class EsvApiService {
  private endpoint: string;
  private ssl: boolean;
  private token: string;
  private nopost: boolean;

  constructor() {
    // Diese Werte werden später aus der Konfiguration/Umgebungsvariablen geladen
    this.endpoint = process.env.ESV_ENDPOINT || '';
    this.ssl = process.env.ESV_SSL === 'true';
    this.token = process.env.ESV_TOKEN || '';
    this.nopost = process.env.ESV_NOPOST === 'true' || process.env.NODE_ENV === 'development';
  }

  /**
   * Lädt alle Veranstaltungen für einen Benutzer
   */
  async getVeranstaltungen(esvId: string, password: string): Promise<EsvVeranstaltung[]> {
    if (!this.endpoint) {
      throw new Error('ESV Endpoint nicht konfiguriert');
    }

    const url = `${this.endpoint}veranstaltungen`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${esvId}:${password}`).toString('base64')}`,
          'User-Agent': `turniermanager.eu/1.1; Token=${this.token}`,
          'Accept': 'application/vnd.tanzsport.esv.v1.veranstaltungsliste.l2+json'
        }
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('ESV-Zugangsdaten sind nicht korrekt oder Du darfst auf diese Veranstaltung nicht zugreifen.');
      }

      if (!response.ok) {
        throw new Error(`ESV API Fehler: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Fehler beim Laden der Veranstaltungen:', error);
      throw error;
    }
  }

  /**
   * Lädt die Turniere für eine spezifische Veranstaltung
   */
  async getTurniere(veranstaltungId: string, esvId: string, password: string): Promise<EsvVeranstaltung> {
    if (!this.endpoint) {
      throw new Error('ESV Endpoint nicht konfiguriert');
    }

    const url = `${this.endpoint}turniere/${veranstaltungId}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${esvId}:${password}`).toString('base64')}`,
          'User-Agent': `turniermanager.eu/1.1; Token=${this.token}`,
          'Accept': 'application/vnd.tanzsport.esv.v1.veranstaltung.l2+json'
        }
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('ESV-Zugangsdaten sind nicht korrekt oder Du darfst auf diese Veranstaltung nicht zugreifen.');
      }

      if (!response.ok) {
        throw new Error(`ESV API Fehler: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Fehler beim Laden der Turniere:', error);
      throw error;
    }
  }

  /**
   * Lädt die Startliste für eine Veranstaltung
   */
  async getStartliste(veranstaltungId: string, esvId: string, password: string): Promise<EsvStartliste> {
    if (!this.endpoint) {
      throw new Error('ESV Endpoint nicht konfiguriert');
    }

    const url = `${this.endpoint}startliste/veranstaltung/${veranstaltungId}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${esvId}:${password}`).toString('base64')}`,
          'User-Agent': `turniermanager.eu/1.1; Token=${this.token}`,
          'Accept': 'application/vnd.tanzsport.esv.v1.startliste.l2+json'
        }
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('ESV-Zugangsdaten sind nicht korrekt oder Du darfst auf diese Veranstaltung nicht zugreifen.');
      }

      if (!response.ok) {
        throw new Error(`ESV API Fehler: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Fehler beim Laden der Startliste:', error);
      throw error;
    }
  }

  /**
   * Lädt die Funktionäre
   */
  async getFunktionaere(esvId: string, password: string): Promise<unknown[]> {
    if (!this.endpoint) {
      throw new Error('ESV Endpoint nicht konfiguriert');
    }

    const url = `${this.endpoint}funktionaere`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${esvId}:${password}`).toString('base64')}`,
          'User-Agent': `turniermanager.eu/1.1; Token=${this.token}`,
          'Accept': 'application/vnd.tanzsport.esv.v1.funktionaere.l2+json'
        }
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('ESV-Zugangsdaten sind nicht korrekt oder Du darfst auf diese Veranstaltung nicht zugreifen.');
      }

      if (!response.ok) {
        throw new Error(`ESV API Fehler: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Fehler beim Laden der Funktionäre:', error);
      throw error;
    }
  }

  /**
   * Prüft die ESV-Verbindung mit den gegebenen Credentials
   */
  async testConnection(esvId: string, password: string): Promise<boolean> {
    try {
      await this.getVeranstaltungen(esvId, password);
      return true;
    } catch (error) {
      console.error('ESV-Verbindungstest fehlgeschlagen:', error);
      return false;
    }
  }

  /**
   * Hilfsmethode: Filtert Veranstaltungen nach Ausrichter
   */
  filterVeranstaltungenNachAusrichter(veranstaltungen: EsvVeranstaltung[], ausrichterId: string): EsvVeranstaltung[] {
    return veranstaltungen.filter(veranstaltung => veranstaltung.ausrichter.id === ausrichterId);
  }

  /**
   * Hilfsmethode: Filtert Turniere nach Saison (Jahr)
   */
  filterTurniereNachSaison(veranstaltungen: EsvVeranstaltung[], jahr: number): EsvVeranstaltung[] {
    return veranstaltungen.filter(veranstaltung => {
      const veranstaltungJahr = new Date(veranstaltung.datumVon).getFullYear();
      return veranstaltungJahr === jahr;
    });
  }

  /**
   * Hilfsmethode: Erstellt Playlist-Namen basierend auf Turnier-Daten
   */
  createPlaylistName(turnier: EsvTurnier): string {
    return `${turnier.turnierart} - ${turnier.startgruppe} - ${turnier.startklasseLiga}`;
  }
}

export const esvApiService = new EsvApiService();
