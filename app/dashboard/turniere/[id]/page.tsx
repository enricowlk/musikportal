"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FiCalendar, FiMapPin, FiUsers, FiMusic, FiPlus, FiClock, FiChevronLeft, FiDownload } from "react-icons/fi";
import NavBar from "@/app/components/Navigation/Navbar";
import { useTheme } from "@/app/components/Theme/ThemeProvider";
import { Turnier, PlaylistWithTurnier } from "@/app/types";

type TurnierWithPlaylists = Turnier & {
  playlists: PlaylistWithTurnier[];
};

export default function TurnierDetail() {
  const params = useParams();
  const { theme } = useTheme();
  const [turnier, setTurnier] = useState<TurnierWithPlaylists | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const turnierId = params.id as string;

  useEffect(() => {
    if (!turnierId) return;

    const loadTurnier = async () => {
      try {
        const response = await fetch(`/api/turniere/${turnierId}`);
        if (!response.ok) {
          throw new Error('Turnier nicht gefunden');
        }
        const data = await response.json();
        setTurnier(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden');
      } finally {
        setIsLoading(false);
      }
    };

    loadTurnier();
  }, [turnierId]);

  // Export-Funktionen
  const handleExportPlaylist = async (playlistId: string, format: 'm3u' | 'xml') => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}/export?format=${format}`);
      
      if (!response.ok) {
        throw new Error('Export fehlgeschlagen');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Dateiname aus Content-Disposition Header extrahieren oder Fallback verwenden
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `playlist.${format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]*)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export-Fehler:', error);
      alert('Export fehlgeschlagen. Bitte versuchen Sie es erneut.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatPlaylistDate = (dateString: string) => {
    if (!dateString) return 'Unbekannt';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unbekannt';
    
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isUpcoming = (dateString: string) => {
    const turnierDate = new Date(dateString);
    const today = new Date();
    const diffTime = turnierDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Theme-basierte Styling
  const cardBg = theme === 'dark' ? 'bg-black/20' : 'bg-white';
  const cardBorder = theme === 'dark' ? 'border-[#333]' : 'border-gray-200';
  const badgeBg = theme === 'dark' ? 'bg-[#111] border-[#333] text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-700';
  const textSecondary = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const primaryText = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  
  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="h-12 bg-gray-300 rounded w-2/3 mb-4"></div>
            <div className="h-6 bg-gray-300 rounded w-1/2 mb-8"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !turnier) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Turnier nicht gefunden</h2>
            <p className={textSecondary}>{error}</p>
            <Link 
            href="/dashboard" 
            className={`flex items-center gap-1 mb-6 group ${primaryText} transition-all duration-300`}
          >
            <FiChevronLeft className="text-lg group-hover:-translate-x-1 transition-transform" />
            <span className="relative">
              Zurück
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-[#999] group-hover:w-full transition-all duration-300"></span>
            </span>
          </Link>
          </div>
        </div>
      </div>
    );
  }

  const daysUntil = isUpcoming(turnier.datum);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header mit Zurück-Button */}
        <div className="mb-6">
          <Link 
            href="/dashboard" 
            className={`flex items-center gap-1 mb-6 group ${primaryText} transition-all duration-300`}
          >
            <FiChevronLeft className="text-lg group-hover:-translate-x-1 transition-transform" />
            <span className="relative">
              Zurück
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-[#999] group-hover:w-full transition-all duration-300"></span>
            </span>
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                {turnier.name}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className={`flex items-center gap-2 ${textSecondary}`}>
                  <FiCalendar size={16} />
                  <span>{formatDate(turnier.datum)}</span>
                  {daysUntil >= 0 && (
                    <span className="flex items-center gap-1 ml-2">
                      <FiClock size={12} />
                      {daysUntil === 0 ? 'Heute' : 
                       daysUntil === 1 ? 'Morgen' : 
                       `in ${daysUntil} Tagen`}
                    </span>
                  )}
                </div>
                <div className={`flex items-center gap-2 ${textSecondary}`}>
                  <FiMapPin size={16} />
                  <span>{turnier.ort}</span>
                </div>
                <div className={`flex items-center gap-2 ${textSecondary}`}>
                  <FiUsers size={16} />
                  <span>{turnier.ausrichter}</span>
                </div>
              </div>
            </div>
            
            <span className={`px-3 py-1 rounded-full text-sm font-medium border self-start ${badgeBg}`}>
              {turnier.status === 'anstehend' ? 'Anstehend' : 
               turnier.status === 'laufend' ? 'Läuft' : 'Abgeschlossen'}
            </span>
          </div>

          {turnier.beschreibung && (
            <p className={`mt-4 ${textSecondary}`}>
              {turnier.beschreibung}
            </p>
          )}
        </div>

        {/* Playlists Sektion */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <FiMusic />
              Playlists für dieses Turnier
              <span className={`text-sm font-normal ${textSecondary}`}>
                ({turnier.playlists?.length || 0})
              </span>
            </h2>
            <Link 
              href={`/dashboard/playlists/create?turnier=${turnier.id}`}
              className={`z-1 flex items-center gap-2 text-white px-5 py-2.5 rounded-lg transition-all shadow-md bg-[#333] bg-[length:0%_100%] hover:bg-[length:100%_100%] bg-gradient-to-r from-white/80 to-[#888] bg-no-repeat transition-[background-size] duration-400`}
            >
              <FiPlus size={16} />
              Neue Playlist
            </Link>
          </div>

          {(!turnier.playlists || turnier.playlists.length === 0) ? (
            <div className="text-center py-12 z-10 relative">
              <FiMusic className="mx-auto text-6xl mb-4" style={{ color: 'var(--foreground-alt)' }} />
              <h3 className="text-xl font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Noch keine Playlists
              </h3>
              <p className={textSecondary}>
                Erstellen Sie die erste Playlist für dieses Turnier.
              </p>
              <Link 
                href={`/dashboard/playlists/create?turnier=${turnier.id}`}
                className={`mt-2 inline-flex flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all bg-white/90 bg-[length:0%_100%] hover:bg-[length:100%_100%] bg-gradient-to-r from-white/80 to-[#888] bg-no-repeat transition-[background-size] duration-400 shadow-md hover:shadow-lg text-dark`}
              >
                <FiPlus className={`text-black text-lg`} size={16} />
                <span className={`text-black`}>Playlist erstellen</span>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {turnier.playlists.map((playlist) => (
                <div key={playlist.id} className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-lg z-10 relative ${cardBg} ${cardBorder}`}>
                  {/* Playlist Titel und Info - klickbar für Navigation */}
                  <Link href={`/dashboard/playlists/${playlist.id}`} className="block cursor-pointer">
                    <h3 className="font-semibold mb-2 line-clamp-2 hover:text-blue-600 transition-colors" style={{ color: 'var(--foreground)' }}>
                      {playlist.name}
                    </h3>
                    
                    <div className={`text-sm ${textSecondary} space-y-1 mb-3`}>
                      <div className="flex items-center gap-2">
                        <FiMusic size={14} />
                        <span>{playlist.songCount} Songs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiClock size={14} />
                        <span>Zuletzt bearbeitet: {formatPlaylistDate(playlist.updatedAt)}</span>
                      </div>
                    </div>
                  </Link>
                  
                  {/* Export Buttons */}
                  <div className="flex gap-2 pt-2 border-t border-gray-200/50">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleExportPlaylist(playlist.id, 'm3u');
                      }}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded transition-colors ${textSecondary} hover:text-blue-600 hover:bg-blue-50/50`}
                      title="Als M3U exportieren (für VLC, Winamp, etc.)"
                    >
                      <FiDownload size={12} />
                      M3U
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleExportPlaylist(playlist.id, 'xml');
                      }}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded transition-colors ${textSecondary} hover:text-green-600 hover:bg-green-50/50`}
                      title="Als XML exportieren (für iTunes, Music, etc.)"
                    >
                      <FiDownload size={12} />
                      XML
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
