// app/dashboard/playlists/create/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiMusic, FiX, FiPlay, FiPause, FiPlus, FiSearch } from "react-icons/fi";
import NavBar from "@/app/components/Navigation/Navbar";
import { usePlayer } from "@/app/context/PlayerContent";
import { Song } from '@/app/types';


export default function CreatePlaylist() {
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [playlistName, setPlaylistName] = useState("");
  const router = useRouter();
  const {
    currentlyPlaying, 
    isPlaying, 
    songs, 
    setSongs, 
    playSong, 
    pauseSong
  } = usePlayer();

  // Lade vorhandene Songs beim Start
  useEffect(() => {
    const loadSongs = async () => {
      const res = await fetch("/api/songs");
      const data = await res.json();
      setSongs(data);
      setFilteredSongs(data);
    };
    loadSongs();
  }, [setSongs]);

  // Filtere Songs basierend auf Suchanfrage
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSongs(songs);
    } else {
      const filtered = songs.filter(song =>
        song.filename
          .toLowerCase()
          .replace(/^\d+_/, "")
          .replace(/\.(mp3|wav)$/i, "")
          .includes(searchQuery.toLowerCase())
      );
      setFilteredSongs(filtered);
    }
  }, [searchQuery, songs]);

  const toggleSongSelection = (songId: string) => {
    setSelectedSongs(prev =>
      prev.includes(songId)
        ? prev.filter(id => id !== songId)
        : [...prev, songId]
    );
  };

  const handleCreatePlaylist = async () => {
    if (!playlistName || selectedSongs.length === 0) {
      alert("Name und mindestens 1 Song benötigt!");
      return;
    }

    const res = await fetch("/api/playlists/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: playlistName,
        songIds: selectedSongs,
      }),
    });

    if (res.ok) {
      router.push("/dashboard/playlists");
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }} suppressHydrationWarning>
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <FiMusic className="text-3xl text-blue-500" />
            <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Neue Playlist erstellen</h1>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Song-Auswahl */}
            <div
              className="z-1 rounded-xl shadow-md border overflow-hidden"
              style={{ background: 'var(--background)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
            >
              <div className="p-6" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
                <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>Verfügbare Songs</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--foreground)' }}>{songs.length} Songs verfügbar</p>
                
                {/* Suchfeld */}
                <div className="mt-4 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                    placeholder="Songs suchen..."
                    style={{ color: 'var(--foreground)', background: 'var(--background)', borderColor: 'var(--border)' }}
                  />
                </div>
              </div>
              <div className="p-4 max-h-[500px] overflow-y-auto space-y-3">
                {filteredSongs.length === 0 ? (
                  <div className="text-center py-8" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
                    <FiSearch className="mx-auto text-2xl mb-2" />
                    <p>Keine Songs gefunden</p>
                  </div>
                ) : (
                  filteredSongs.map(song => (
                    <div
                      key={song.id}
                      className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedSongs.includes(song.id)
                          ? "border-2"
                          : "border border-gray-300 hover:shadow-sm"
                      }`}
                      style={{
                        background: selectedSongs.includes(song.id) ? 'var(--background-alt)' : 'var(--background)',
                        color: 'var(--foreground)',
                        borderColor: selectedSongs.includes(song.id) ? '#3b82f6' : 'var(--border)', // blue-500
                        borderWidth: selectedSongs.includes(song.id) ? '2px' : '1px'
                      }}
                      onClick={() => toggleSongSelection(song.id)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium truncate" style={{ color: 'var(--foreground)' }}>
                          {song.filename.replace(/^\d+_?/, "").replace(/_/g, " ").replace(/\.(mp3|wav)$/i, "")}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (currentlyPlaying === song.path) {
                              if (isPlaying) {
                                pauseSong();
                              } else {
                                playSong(song.path);
                              }
                            } else {
                              playSong(song.path);
                            }
                          }}
                          className={`ml-3 p-2 rounded-full transition-colors ${
                            currentlyPlaying === song.path && isPlaying
                              ? "bg-red-100 text-red-600"
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          {currentlyPlaying === song.path && isPlaying ? <FiPause /> : <FiPlay />}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Playlist-Editor */}
            <div
              className="z-1 rounded-xl shadow-md border overflow-hidden"
              style={{ background: 'var(--background)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
            >
              <div className="p-6" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
                <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>Playlist Details</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--foreground)' }}>
                  {selectedSongs.length} {selectedSongs.length === 1 ? 'Song' : 'Songs'} ausgewählt
                </p>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>Playlist-Name</label>
                  <input
                    type="text"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                    placeholder="Meine Playlist"
                    style={{ color: 'var(--foreground)', background: 'var(--background)' }}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>Ausgewählte Songs</h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedSongs.length === 0 ? (
                      <div className="text-center py-4" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
                        <FiMusic className="mx-auto text-2xl mb-2" />
                        <p>Noch keine Songs ausgewählt</p>
                      </div>
                    ) : (
                      selectedSongs.map(songId => {
                        const song = songs.find(s => s.id === songId);
                        return song ? (
                          <div key={songId} className="flex items-center justify-between p-3 rounded-lg border border-gray-700/50" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
                            <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                              {song.filename.replace(/^\d+_/, "").replace(/\.(mp3|wav)$/i, "")}
                            </span>
                            <button
                              onClick={() => toggleSongSelection(songId)}
                              className="p-2 rounded-full hover:bg-red-400 transition-colors"
                              style={{ color: 'var(--foreground)' }}
                            >
                              <FiX />
                            </button>
                          </div>
                        ) : null;
                      })
                    )}
                  </div>
                </div>

                <button
                  onClick={handleCreatePlaylist}
                  disabled={!playlistName || selectedSongs.length === 0}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    !playlistName || selectedSongs.length === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg"
                  }`}
                >
                  <FiPlus /> Playlist erstellen
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}