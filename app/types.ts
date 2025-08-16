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
};

export type Turnier = {
  id: string;
  name: string;
  datum: string;
  ort: string;
  veranstalter: string;
  status: 'anstehend' | 'laufend' | 'abgeschlossen';
  beschreibung?: string;
};

export type PlaylistWithTurnier = {
  id: string;
  name: string;
  songCount: number;
  updatedAt: string;
  turnierId?: string;
  turnierName?: string;
};
