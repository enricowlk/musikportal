"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FiTrash2, FiSearch, FiPlus } from "react-icons/fi";
import NavBar from "@/app/components/Navigation/Navbar";
import { useTheme } from "@/app/components/Theme/ThemeProvider";

type Playlist = {
  id: string;
  name: string;
  songCount: number;
  updatedAt: string;
};

type PlaylistApiResponse = {
  id: string;
  name: string;
  songIds: string[];
  createdAt: string;
};

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "updated">("updated");
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [playlistsRes] = await Promise.all([
          fetch("/api/playlists"),
          fetch("/api/songs"),
        ]);

        const playlistsData: PlaylistApiResponse[] = await playlistsRes.json();

        setPlaylists(
          playlistsData.map((p) => ({
            id: p.id,
            name: p.name,
            songCount: p.songIds?.length || 0,
            updatedAt: p.createdAt || new Date().toISOString(),
          }))
        );
      } catch (error) {
        console.error("Fehler beim Laden:", error);
        alert("Daten konnten nicht geladen werden");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredPlaylists = playlists
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const handleDelete = async (id: string) => {
    if (!confirm("Playlist wirklich löschen?")) return;

    try {
      const res = await fetch(`/api/playlists/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPlaylists((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      alert("Löschen fehlgeschlagen");
    }
  };

  if (isLoading) return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <NavBar />
      <div className="animate-pulse text-center">
        <div className="h-8 w-48 rounded-lg mx-auto mb-4" style={{ background: 'var(--background-alt)' }}></div>
        <p style={{ color: 'var(--foreground-alt)' }}>Lade Playlists...</p>
      </div>
    </div>
  );

  // Farben für beide Themes
  const buttonBg = theme === 'dark' ? 'bg-[#333] hover:bg-[#999]' : 'bg-[#666] hover:bg-[#999]';
  const cardBg = theme === 'dark' ? 'bg-black/20' : 'bg-white';
  const cardBorder = theme === 'dark' ? 'border-[#333]' : 'border-gray-200';
  const inputBg = theme === 'dark' ? 'bg-black/20' : 'bg-white';
  const inputBorder = theme === 'dark' ? 'border-[#333]' : 'border-gray-300';
  const inputFocus = theme === 'dark' ? 'focus:ring-gray-500 focus:border-gray-500' : 'focus:ring-gray-400 focus:border-gray-400';
  const footerBg = theme === 'dark' ? 'bg-[#111]' : 'bg-gray-50';
  const footerBorder = theme === 'dark' ? 'border-[#333]' : 'border-gray-200';
  const badgeBg = theme === 'dark' ? 'bg-[#111] border-[#333] text-gray-200' : 'bg-gray-100 border-gray-300 text-gray-800';
  const dateColor = theme === 'dark' ? 'text-[#999]' : 'text-[#555]';

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Playlists</h1>
            <p className="mt-1">{playlists.length} Playlists insgesamt</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="relative flex-grow max-w-md">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--foreground-alt)' }} />
              <input
                type="text"
                placeholder="Playlists durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 h-[44px] border rounded-lg ${inputFocus} transition-all ${inputBg} ${inputBorder}`}
              />
            </div>

            <div className="relative flex items-center h-[44px]">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "name" | "updated")}
                className={`border rounded-lg px-5 pr-8 py-2.5 h-full ${inputFocus} transition-all appearance-none w-full ${inputBg} ${inputBorder}`}
              >
                <option value="updated">Neueste</option>
                <option value="name">A-Z</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center" style={{height: '44px'}}>
                <svg width="20" height="20" fill="none" viewBox="0 0 20 20" style={{display: 'block', margin: 'auto'}}><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </div>
            
            <Link 
              href="/dashboard/playlists/create" 
              className={`z-1 flex items-center gap-2 text-white px-5 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg ${buttonBg}`}
            >
              <FiPlus className="text-lg" /> Neue Playlist
            </Link>
          </div>
        </div>

        {filteredPlaylists.length === 0 ? (
          <div className={`rounded-xl shadow-sm p-8 border ${cardBg} ${cardBorder}`}>
            <p className="text-lg">Keine Playlists gefunden</p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="mt-4 hover:underline"
                style={{ color: 'var(--foreground-alt)' }}
              >
                Filter zurücksetzen
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlaylists.map(playlist => (
              <div 
                key={playlist.id} 
                className={`z-1 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border ${cardBg} ${cardBorder}`}
              >
                <Link 
                  href={`/dashboard/playlists/${playlist.id}`} 
                  className="block p-6 transition-colors"
                >
                  <h3 className="font-semibold text-xl mb-1">{playlist.name}</h3>
                  <div className="flex items-center gap-2 text-sm mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs border ${badgeBg}`}>
                      {playlist.songCount} {playlist.songCount === 1 ? 'Song' : 'Songs'}
                    </span>
                  </div>
                  <p className={`text-xs ${dateColor}`}>
                    Zuletzt bearbeitet: {new Date(playlist.updatedAt).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                </Link>
                <div className={`flex justify-end px-4 py-3 border-t ${footerBg} ${footerBorder}`}>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(playlist.id);
                    }}
                    className="p-2 rounded-full transition-colors hover:bg-gray-700/20"
                    style={{ color: 'var(--foreground-alt)' }}
                    title="Löschen"
                  >
                    <FiTrash2 className="text-lg" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}