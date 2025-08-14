export type Song = {
  id: string;
  filename: string;
  path: string;
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
