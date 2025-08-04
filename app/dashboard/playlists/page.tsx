"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FiEdit, FiTrash2, FiSearch, FiPlus } from "react-icons/fi";
import NavBar from "@/app/components/Navigation/Navbar";

type Playlist = {
  id: string;
  name: string;
  songCount: number;
  updatedAt: string;
};

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "updated">("updated");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [playlistsRes, songsRes] = await Promise.all([
          fetch("/api/playlists"),
          fetch("/api/songs"),
        ]);

        const playlistsData = await playlistsRes.json();
        const songsData = await songsRes.json();

        setPlaylists(
          playlistsData.map((p: any) => ({
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
    } catch (error) {
      alert("Löschen fehlgeschlagen");
    }
  };

  if (isLoading) return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }} suppressHydrationWarning>
      <NavBar />
      <div className="animate-pulse text-center">
        <div className="h-8 w-48 rounded-lg mx-auto mb-4" style={{ background: 'var(--background-alt)' }}></div>
        <p style={{ color: 'var(--foreground-alt)' }}>Lade Playlists...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }} suppressHydrationWarning>
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Meine Playlists</h1>
            <p className="mt-1" style={{ color: 'var(--foreground)' }}>{playlists.length} Playlists insgesamt</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="relative flex-grow max-w-md">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--foreground-alt)' }} />
              <input
                type="text"
                placeholder="Playlists durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 h-[44px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                style={{ color: 'var(--foreground)', background: 'var(--background)' }}
              />
            </div>

            <div className="relative flex items-center h-[44px]">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-5 pr-8 py-2.5 h-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none w-full"
                style={{ color: 'var(--foreground)', background: 'var(--background)' }}
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
              className="z-1 flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              <FiPlus className="text-lg" /> Neue Playlist
            </Link>
          </div>
        </div>

        {filteredPlaylists.length === 0 ? (
          <div style={{ background: 'var(--background)', color: 'var(--foreground)' }} className="rounded-xl shadow-sm p-8 border" suppressHydrationWarning>
            <p style={{ color: 'var(--foreground)' }} className="text-lg">Keine Playlists gefunden</p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                style={{ color: 'var(--foreground)' }} className="mt-4 hover:underline"
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
                style={{ background: 'var(--background)', color: 'var(--foreground)' }}
                className="z-1 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border" suppressHydrationWarning
              >
                <Link 
                  href={`/dashboard/playlists/${playlist.id}`} 
                  style={{ color: 'var(--foreground)' }}
                  className="block p-6 transition-colors"
                >
                  <h3 className="font-semibold text-xl mb-1" style={{ color: 'var(--foreground)' }}>{playlist.name}</h3>
                  <div className="flex items-center gap-2 text-sm mb-3">
                    <span style={{ background: 'var(--background)', color: '#3b82f6', border: '1px solid #3b82f6' }} className="px-2 py-1 rounded-full text-xs">
                      {playlist.songCount} {playlist.songCount === 1 ? 'Song' : 'Songs'}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--foreground)' }}>
                    Zuletzt bearbeitet: {new Date(playlist.updatedAt).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                </Link>
                <div style={{ borderTop: '1px solid #e5e7eb', background: 'var(--background)' }} className="flex justify-end px-4 py-3">
                  <Link 
                    href={`/dashboard/playlists/${playlist.id}/edit`}
                    style={{ color: 'var(--foreground)' }}
                    className="p-2 rounded-full transition-colors"
                    title="Bearbeiten"
                  >
                    <FiEdit className="text-lg" />
                  </Link>
                  <button 
                    onClick={() => handleDelete(playlist.id)}
                    style={{ color: 'var(--foreground)' }}
                    className="p-2 rounded-full transition-colors"
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