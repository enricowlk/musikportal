export type UserRole = 'admin' | 'ausrichter' | 'formation';

export type TokenData = {
  id: string;
  name: string;
  token: string;
  description: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
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
  ausrichter: string;
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
