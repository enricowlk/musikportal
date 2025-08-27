export type UserRole = 'admin' | 'ausrichter' | 'formation';

export type TokenData = {
  id: string;
  name: string;
  token: string;
  description: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  // ESV-spezifische Felder
  esvId?: string;
  vereinId?: string;
};

export type UserPermissions = {
  canUpload: boolean;
  canViewPlaylists: boolean;
  canCreatePlaylists: boolean;
  canDeletePlaylists: boolean;
  canViewTurniere: boolean;
  canCreateTurniere: boolean;
  canViewAllTurniere: boolean;
  canAccessDashboard: boolean;
  canManageTokens: boolean;
};

// ESV API Typen basierend auf den Ruby-Dateien
export type EsvClub = {
  id: string;
  name: string;
  ltv: {
    name: string;
  };
};

export type EsvFormation = {
  id: string;
  formationsnr: number;
  aufstellungsversion: number;
  name: string;
  club: EsvClub;
};

export type EsvVeranstaltung = {
  id: string;
  veranstalter: EsvClub;
  ausrichter: EsvClub;
  datumVon: string;
  datumBis?: string;
  turnierstaette: {
    ort: string;
    name?: string;
  };
  turniere: EsvTurnier[];
  flaechen: Array<{
    typ: string;
    laenge: number;
    breite: number;
  }>;
  funktionaere: EsvPerson[];
  wertungsrichter: EsvPerson[];
};

export type EsvTurnier = {
  id: string;
  turnierart: 'JMC' | 'JMD';
  turnierform: string;
  startgruppe: 'Kinder' | 'Jugend' | 'Hauptgruppe';
  startklasseLiga: string;
  wettbewerbsart: 'Formation';
  zulassung: string[];
  datumVon: string;
  name?: string;
};

export type EsvPerson = {
  id: string;
  vorname: string;
  nachname: string;
  club: EsvClub;
};

export type EsvStartliste = Array<{
  id: string;
  formationsnr: number;
  aufstellungsversion: number;
  team: {
    name: string;
    formationsNr: number;
    aufstellungVersion: number;
  };
  club: EsvClub;
  staat: string;
  personen: EsvPerson[];
  meldungen: Array<{
    turnierId: string;
    startNr: number;
    meldung: boolean;
    startsperre: boolean;
  }>;
}>;

export type Startgruppe = 'Kinder' | 'Jugend' | 'Hauptgruppe';

export type DurationLimits = {
  min: number; // in Sekunden
  max: number; // in Sekunden
};

// Erweiterte Song-Typen für ESV-Integration
export type Song = {
  id: string;
  filename: string;
  path: string;
  // Erweiterte Metadaten
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  genre?: string;
  // Zusätzliche Metadaten-Informationen
  extractedTitle?: string;
  extractedArtist?: string;
  originalTitle?: string | null;
  originalArtist?: string | null;
  // ESV-spezifische Felder
  formationsnr?: number;
  aufstellungsversion?: number;
  startnummer?: string;
  clubName?: string;
  teamName?: string;
  startgruppe?: Startgruppe;
  esvTurnierId?: string;
  isValidDuration?: boolean;
  durationError?: string;
};

export type Turnier = {
  id: string;
  name: string;
  datum: string;
  ort: string;
  ausrichter: string;
  status: 'anstehend' | 'laufend' | 'abgeschlossen';
  beschreibung?: string;
  // ESV-spezifische Felder
  esvId?: string;
  turnierart?: 'JMC' | 'JMD';
  startgruppe?: Startgruppe;
  startklasseLiga?: string;
  wettbewerbsart?: string;
  ausrichterId?: string;
};

export type PlaylistWithTurnier = {
  id: string;
  name: string;
  songCount: number;
  updatedAt: string;
  turnierId?: string;
  turnierName?: string;
  // ESV-spezifische Felder
  esvTurnierId?: string;
  turnierart?: 'JMC' | 'JMD';
  startgruppe?: Startgruppe;
  startklasseLiga?: string;
};

// Formular-Typen für Upload
export type FormationUploadParams = {
  formationsnr: number;
  aufstellungsversion: number;
};

export type MusicUploadData = FormationUploadParams & {
  file: File;
  teamName?: string;
  clubName?: string;
};
