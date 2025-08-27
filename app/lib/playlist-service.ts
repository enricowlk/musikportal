import { EsvVeranstaltung, EsvTurnier, PlaylistWithTurnier, Song } from '../types';
import fs from 'fs/promises';
import path from 'path';

export class PlaylistService {
  
  /**
   * Erstellt automatisch Playlists basierend auf ESV-Turnier-Daten
   */
  static async createPlaylistsFromTurniere(veranstaltung: EsvVeranstaltung): Promise<PlaylistWithTurnier[]> {
    const playlists: PlaylistWithTurnier[] = [];

    for (const turnier of veranstaltung.turniere) {
      // Nur Formation-Turniere berücksichtigen
      if (turnier.wettbewerbsart === 'Formation') {
        const playlist = await this.createPlaylistFromTurnier(turnier);
        playlists.push(playlist);
      }
    }

    return playlists;
  }

  /**
   * Erstellt eine einzelne Playlist aus einem Turnier
   */
  private static async createPlaylistFromTurnier(
    turnier: EsvTurnier
  ): Promise<PlaylistWithTurnier> {
    const playlistName = this.generatePlaylistName(turnier);
    const playlistId = this.generatePlaylistId(turnier);

    const playlist: PlaylistWithTurnier = {
      id: playlistId,
      name: playlistName,
      songCount: 0,
      updatedAt: new Date().toISOString(),
      turnierId: turnier.id,
      turnierName: playlistName,
      esvTurnierId: turnier.id,
      turnierart: turnier.turnierart,
      startgruppe: turnier.startgruppe,
      startklasseLiga: turnier.startklasseLiga
    };

    // Playlist in JSON-Datei speichern
    await this.savePlaylistToFile(playlist);

    return playlist;
  }

  /**
   * Generiert einen Playlist-Namen basierend auf Turnier-Daten
   */
  private static generatePlaylistName(turnier: EsvTurnier): string {
    return `${turnier.turnierart} - ${turnier.startgruppe} - ${turnier.startklasseLiga}`;
  }

  /**
   * Generiert eine eindeutige Playlist-ID
   */
  private static generatePlaylistId(turnier: EsvTurnier): string {
    return `esv_${turnier.id}_${turnier.turnierart}_${turnier.startgruppe}_${turnier.startklasseLiga}`
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');
  }

  /**
   * Ordnet einen Song einer Playlist basierend auf Formation zu
   */
  static async assignSongToPlaylist(
    song: Song,
    esvTurnierId: string
  ): Promise<boolean> {
    try {
      // Playlist finden
      const playlist = await this.findPlaylistByEsvTurnierId(esvTurnierId);
      if (!playlist) {
        console.warn(`Playlist für ESV-Turnier-ID ${esvTurnierId} nicht gefunden`);
        return false;
      }

      // Song zur Playlist hinzufügen
      await this.addSongToPlaylist(playlist.id, song);
      return true;
    } catch (error) {
      console.error('Fehler beim Zuordnen des Songs zur Playlist:', error);
      return false;
    }
  }

  /**
   * Findet eine Playlist basierend auf ESV-Turnier-ID
   */
  static async findPlaylistByEsvTurnierId(esvTurnierId: string): Promise<PlaylistWithTurnier | null> {
    try {
      const playlistsPath = path.join(process.cwd(), 'data', 'playlists.json');
      const playlistsData = await fs.readFile(playlistsPath, 'utf-8');
      const playlists: PlaylistWithTurnier[] = JSON.parse(playlistsData);

      return playlists.find(p => p.esvTurnierId === esvTurnierId) || null;
    } catch (error) {
      console.error('Fehler beim Suchen der Playlist:', error);
      return null;
    }
  }

  /**
   * Fügt einen Song zu einer Playlist hinzu
   */
  private static async addSongToPlaylist(playlistId: string, song: Song): Promise<void> {
    try {
      // Playlist-spezifische Song-Datei
      const playlistSongsPath = path.join(process.cwd(), 'data', 'playlist-songs', `${playlistId}.json`);
      
      let songs: Song[] = [];
      try {
        const songsData = await fs.readFile(playlistSongsPath, 'utf-8');
        songs = JSON.parse(songsData);
      } catch {
        // Datei existiert noch nicht, das ist ok
      }

      // Prüfen ob Song bereits in der Playlist ist
      const existingIndex = songs.findIndex(s => s.id === song.id);
      if (existingIndex >= 0) {
        // Song aktualisieren
        songs[existingIndex] = song;
      } else {
        // Neuen Song hinzufügen
        songs.push(song);
      }

      // Songs nach Startnummer sortieren
      songs.sort((a, b) => {
        const aNum = parseInt(a.startnummer || '999');
        const bNum = parseInt(b.startnummer || '999');
        return aNum - bNum;
      });

      // Datei speichern
      await fs.mkdir(path.dirname(playlistSongsPath), { recursive: true });
      await fs.writeFile(playlistSongsPath, JSON.stringify(songs, null, 2));

      // Playlist-Metadaten aktualisieren
      await this.updatePlaylistSongCount(playlistId, songs.length);
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Songs zur Playlist:', error);
      throw error;
    }
  }

  /**
   * Aktualisiert die Song-Anzahl einer Playlist
   */
  private static async updatePlaylistSongCount(playlistId: string, songCount: number): Promise<void> {
    try {
      const playlistsPath = path.join(process.cwd(), 'data', 'playlists.json');
      const playlistsData = await fs.readFile(playlistsPath, 'utf-8');
      const playlists: PlaylistWithTurnier[] = JSON.parse(playlistsData);

      const playlistIndex = playlists.findIndex(p => p.id === playlistId);
      if (playlistIndex >= 0) {
        playlists[playlistIndex].songCount = songCount;
        playlists[playlistIndex].updatedAt = new Date().toISOString();

        await fs.writeFile(playlistsPath, JSON.stringify(playlists, null, 2));
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Playlist-Metadaten:', error);
    }
  }

  /**
   * Exportiert eine Playlist als M3U-Datei
   */
  static async exportPlaylistAsM3U(playlistId: string): Promise<string> {
    try {
      const playlist = await this.getPlaylistById(playlistId);
      if (!playlist) {
        throw new Error('Playlist nicht gefunden');
      }

      const songs = await this.getSongsByPlaylistId(playlistId);
      
      let m3uContent = '#EXTM3U\n';
      m3uContent += `#PLAYLIST:${playlist.name}\n\n`;

      for (const song of songs) {
        const duration = song.duration ? Math.round(song.duration) : -1;
        const title = `${song.startnummer || ''} - ${song.teamName || ''} - ${song.clubName || ''}`.trim();
        
        m3uContent += `#EXTINF:${duration},${title}\n`;
        m3uContent += `${song.path}\n\n`;
      }

      return m3uContent;
    } catch (error) {
      console.error('Fehler beim Exportieren der Playlist:', error);
      throw error;
    }
  }

  /**
   * Lädt eine Playlist anhand der ID
   */
  private static async getPlaylistById(playlistId: string): Promise<PlaylistWithTurnier | null> {
    try {
      const playlistsPath = path.join(process.cwd(), 'data', 'playlists.json');
      const playlistsData = await fs.readFile(playlistsPath, 'utf-8');
      const playlists: PlaylistWithTurnier[] = JSON.parse(playlistsData);

      return playlists.find(p => p.id === playlistId) || null;
    } catch (error) {
      console.error('Fehler beim Laden der Playlist:', error);
      return null;
    }
  }

  /**
   * Lädt alle Songs einer Playlist
   */
  private static async getSongsByPlaylistId(playlistId: string): Promise<Song[]> {
    try {
      const playlistSongsPath = path.join(process.cwd(), 'data', 'playlist-songs', `${playlistId}.json`);
      const songsData = await fs.readFile(playlistSongsPath, 'utf-8');
      return JSON.parse(songsData);
    } catch (error) {
      console.error('Fehler beim Laden der Playlist-Songs:', error);
      return [];
    }
  }

  /**
   * Speichert eine Playlist in die JSON-Datei
   */
  private static async savePlaylistToFile(playlist: PlaylistWithTurnier): Promise<void> {
    try {
      const playlistsPath = path.join(process.cwd(), 'data', 'playlists.json');
      
      let playlists: PlaylistWithTurnier[] = [];
      try {
        const playlistsData = await fs.readFile(playlistsPath, 'utf-8');
        playlists = JSON.parse(playlistsData);
      } catch {
        // Datei existiert noch nicht
      }

      // Playlist hinzufügen oder aktualisieren
      const existingIndex = playlists.findIndex(p => p.id === playlist.id);
      if (existingIndex >= 0) {
        playlists[existingIndex] = playlist;
      } else {
        playlists.push(playlist);
      }

      await fs.mkdir(path.dirname(playlistsPath), { recursive: true });
      await fs.writeFile(playlistsPath, JSON.stringify(playlists, null, 2));
    } catch (error) {
      console.error('Fehler beim Speichern der Playlist:', error);
      throw error;
    }
  }

  /**
   * Lädt alle Playlists für einen spezifischen Ausrichter
   */
  static async getPlaylistsForAusrichter(): Promise<PlaylistWithTurnier[]> {
    try {
      const playlistsPath = path.join(process.cwd(), 'data', 'playlists.json');
      const playlistsData = await fs.readFile(playlistsPath, 'utf-8');
      const playlists: PlaylistWithTurnier[] = JSON.parse(playlistsData);

      // TODO: Filtern basierend auf Ausrichter-ID
      // Hier würde normalerweise eine Verknüpfung zwischen Playlist und Ausrichter bestehen
      return playlists;
    } catch (error) {
      console.error('Fehler beim Laden der Playlists für Ausrichter:', error);
      return [];
    }
  }
}

export const playlistService = PlaylistService;
