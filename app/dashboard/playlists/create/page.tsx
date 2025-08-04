// app/dashboard/playlists/create/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import { FiMusic, FiX, FiPlay, FiPause, FiPlus } from "react-icons/fi";
import NavBar from "@/app/components/Navigation/Navbar";

type Song = {
  id: string;
  filename: string;
  path: string;
};

export default function CreatePlaylist() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [playlistName, setPlaylistName] = useState("");
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const router = useRouter();

  // Lade vorhandene Songs beim Start
  useEffect(() => {
    const loadSongs = async () => {
      const res = await fetch("/api/songs");
      const data = await res.json();
      setSongs(data);
    };
    loadSongs();
  }, []);

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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <FiMusic className="text-3xl text-blue-500" />
            <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Neue Playlist erstellen</h1>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Song-Auswahl */}
            <div
              className="rounded-xl shadow-md border overflow-hidden"
              style={{ background: 'var(--background)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
            >
              <div className="p-6" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
                <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>Verfügbare Songs</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--foreground)' }}>{songs.length} Songs verfügbar</p>
              </div>
              <div className="p-4 max-h-[500px] overflow-y-auto space-y-3">
                {songs.map(song => (
                  <div
                    key={song.id}
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedSongs.includes(song.id)
                        ? "bg-blue-50 border-2 border-blue-300"
                        : "border border-gray-200 hover:border-blue-200 hover:shadow-sm"
                    }`}
                    onClick={() => toggleSongSelection(song.id)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium truncate" style={{ color: 'var(--foreground)' }}>
                        {song.filename.replace(/^\d+_/, "").replace(/\.(mp3|wav)$/i, "")}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentlyPlaying(currentlyPlaying === song.path ? null : song.path);
                        }}
                        className={`ml-3 p-2 rounded-full ${
                          currentlyPlaying === song.path 
                            ? "bg-red-100" 
                            : "bg-blue-100"
                        }`} style={{ color: 'var(--foreground)' }}
                      >
                        {currentlyPlaying === song.path ? <FiPause /> : <FiPlay />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Playlist-Editor */}
            <div
              className="rounded-xl shadow-md border overflow-hidden"
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
                    placeholder="Meine Tanzplaylist"
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
                          <div key={songId} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
                            <span className="font-medium" style={{ color: 'var(--foreground)' }}>
                              {song.filename.replace(/^\d+_/, "").replace(/\.(mp3|wav)$/i, "")}
                            </span>
                            <button
                              onClick={() => toggleSongSelection(songId)}
                              className="p-2 rounded-full hover:bg-red-50 transition-colors"
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

          {/* Audio-Player */}
          {currentlyPlaying && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
              <div className="max-w-6xl mx-auto px-4">
                <AudioPlayer
                  autoPlay={true}
                  src={currentlyPlaying}
                  onPlay={() => {}}
                  style={{ 
                    padding: "16px 0",
                    backgroundColor: "white",
                    boxShadow: "none"
                  }}
                  className="rounded-none"
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}