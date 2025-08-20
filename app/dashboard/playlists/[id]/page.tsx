"use client";
import 'react-h5-audio-player/lib/styles.css';
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FiChevronLeft, FiPlay, FiPause, FiMusic, FiList, FiEdit2, FiTrash2, FiX, FiCheck, FiPlus, FiSearch, FiCalendar } from "react-icons/fi";
import Link from "next/link";
import NavBar from "@/app/components/Navigation/Navbar";
import { usePlayer } from "@/app/context/PlayerContent";
import { useTheme } from "@/app/components/Theme/ThemeProvider";
import { Song } from "@/app/types";

export default function PlaylistDetail() {
  const params = useParams();
  const id = params.id as string; // Fixed this line
  const [songs, setSongs] = useState<Song[]>([]);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [playlistName, setPlaylistName] = useState("");
  const [turnier, setTurnier] = useState<{
    id: string;
    name: string;
    datum: string;
    ort: string;
    ausrichter: string;
    status: string;
  } | null>(null); // Neue State für Turnier-Info
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showAddSongsModal, setShowAddSongsModal] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [canEdit, setCanEdit] = useState(false); // Neue State für Berechtigung

  const { currentlyPlaying, isPlaying, playSong, pauseSong, setSongs: setPlayerSongs } = usePlayer();
  const { theme } = useTheme();

  // Theme-based colors
  const cardBg = theme === 'dark' ? 'bg-[#111]' : 'bg-white';
  const cardBorder = theme === 'dark' ? 'border-[#333]' : 'border-gray-200';
  const inputBg = theme === 'dark' ? 'bg-[#111]' : 'bg-white';
  const inputBorder = theme === 'dark' ? 'border-[#333]' : 'border-gray-300';
  const primaryText = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const secondaryText = theme === 'dark' ? 'text-[#999]' : 'text-[#555]';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const playlistResponse = await fetch(`/api/playlists/${id}`);
        const playlistData = await playlistResponse.json();

        setPlaylistName(playlistData.name);
        setNewPlaylistName(playlistData.name);
        
        // Setze Turnier-Information falls vorhanden
        if (playlistData.turnier) {
          setTurnier(playlistData.turnier);
        }
        
        const processedSongs = (playlistData.songs || []).map((song: Song) => ({
          ...song,
          title: song.title || song.filename
            .replace(/^\d+_?/, "")
            .replace(/_/g, " ")
            .replace(/\.(mp3|wav)$/i, ""),
          artist: song.artist || 'Unbekannter Künstler',
        }));
        
        setSongs(processedSongs);
        // WICHTIG: Player-Kontext mit aktuellen Songs aktualisieren
        setPlayerSongs(processedSongs);

        const songsResponse = await fetch('/api/songs');
        const allSongs = await songsResponse.json();
        setAvailableSongs(allSongs);

        // Prüfe Berechtigungen
        const permissionsResponse = await fetch(`/api/playlists/${id}/permissions`);
        const permissionsData = await permissionsResponse.json();
        setCanEdit(permissionsData.canEdit);
        
      } catch (error) {
        console.error("Fehler beim Laden:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, setPlayerSongs]);

  const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;
  
  if (over && active.id !== over.id) {
    const newItems = arrayMove(
      songs,
      songs.findIndex((item) => item.id === active.id),
      songs.findIndex((item) => item.id === over.id)
    );
    
    setSongs(newItems);
    // Player-Kontext mit neuer Reihenfolge aktualisieren
    setPlayerSongs(newItems);
    
    try {
      const response = await fetch(`/api/playlists/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          songIds: newItems.map((song) => song.id)
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save new order");
      }
    } catch (error) {
      console.error("Fehler beim Speichern der neuen Reihenfolge:", error);
      alert("Die neue Reihenfolge konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.");
    }
  }
};

  const handlePlayAll = () => {
    if (songs.length > 0) {
      setPlayerSongs(songs);
      playSong(songs[0].path);
    }
  };

  const startEditingName = () => {
    setIsEditingName(true);
    setNewPlaylistName(playlistName);
  };

  const cancelEditingName = () => {
    setIsEditingName(false);
  };

  const savePlaylistName = async () => {
    if (!newPlaylistName.trim()) {
      alert("Playlist-Name darf nicht leer sein");
      return;
    }

    try {
      const response = await fetch(`/api/playlists/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newPlaylistName }),
      });

      if (response.ok) {
        setPlaylistName(newPlaylistName);
        setIsEditingName(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Fehler beim Speichern");
      }
    } catch (error) {
      console.error("Fehler beim Speichern des Namens:", error);
      alert("Fehler beim Speichern: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const removeSongFromPlaylist = async (songId: string) => {
  try {
    const response = await fetch(`/api/playlists/${id}/songs/${songId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const newSongList = songs.filter(song => song.id !== songId);
    setSongs(newSongList);
    // Player-Kontext mit aktueller Liste aktualisieren
    setPlayerSongs(newSongList);
    
    // Reihenfolge in der Datenbank aktualisieren
    await fetch(`/api/playlists/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        songIds: newSongList.map((song) => song.id)
      }),
    });

  } catch (error) {
    console.error("Fehler beim Löschen des Songs:", error);
    alert("Der Song konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.");
  }
};

  const toggleAddSongsModal = () => {
    setShowAddSongsModal(!showAddSongsModal);
    setSelectedSongs([]);
    setSearchTerm("");
  };

  const toggleSongSelection = (songId: string) => {
    setSelectedSongs(prev => 
      prev.includes(songId) 
        ? prev.filter(id => id !== songId) 
        : [...prev, songId]
    );
  };

  const addSongsToPlaylist = async () => {
  try {
    const response = await fetch(`/api/playlists/${id}/songs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ songIds: selectedSongs }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const addedSongs = await response.json();
    
    // Die API gibt bereits die korrekt verarbeiteten Songs mit title/artist zurück
    // Neue Songs am Ende hinzufügen und Reihenfolge speichern
    const newSongList = [...songs, ...addedSongs];
    setSongs(newSongList);
    // Player-Kontext mit aktueller Liste aktualisieren
    setPlayerSongs(newSongList);
    
    // Reihenfolge in der Datenbank aktualisieren
    await fetch(`/api/playlists/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        songIds: newSongList.map((song) => song.id)
      }),
    });

    setShowAddSongsModal(false);
    setSelectedSongs([]);
    setSearchTerm("");
  } catch (error) {
    console.error("Fehler beim Hinzufügen der Songs:", error);
    alert("Songs konnten nicht hinzugefügt werden. Bitte versuchen Sie es erneut.");
  }
};

  const filteredAvailableSongs = availableSongs.filter(song => 
    !songs.some(s => s.id === song.id) && 
    (song.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (song.title && song.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
     (song.artist && song.artist.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  if (isLoading) return (
    <div className={`min-h-screen p-6 flex items-center justify-center ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
      <NavBar />
      <div className="animate-pulse flex flex-col items-center">
        <FiMusic className="text-4xl mb-4 animate-bounce" style={{ color: secondaryText }} />
        <div className={`h-8 w-48 rounded-lg mb-4 ${theme === 'dark' ? 'bg-[#333]' : 'bg-gray-200'}`}></div>
        <p style={{ color: secondaryText }}>Lade Playlist...</p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
      <NavBar />
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto">
          <Link 
            href="/dashboard/playlists" 
            className={`flex items-center gap-1 mb-6 group ${primaryText} transition-all duration-300`}
          >
            <FiChevronLeft className="text-lg group-hover:-translate-x-1 transition-transform" />
            <span className="relative">
              Zurück
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-[#999] group-hover:w-full transition-all duration-300"></span>
            </span>
          </Link>
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 p-6 rounded-xl shadow-sm border ${cardBg} ${cardBorder}`}>
            <div className="flex-grow">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className={`text-3xl font-bold border-b focus:outline-none focus:border-blue-500 flex-grow ${primaryText} ${inputBg}`}
                    autoFocus
                  />
                  <button 
                    onClick={savePlaylistName}
                    className="p-2 text-green-600 hover:text-green-800"
                    title="Speichern"
                  >
                    <FiCheck />
                  </button>
                  <button 
                    onClick={cancelEditingName}
                    className="p-2 text-red-600 hover:text-red-800"
                    title="Abbrechen"
                  >
                    <FiX />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className={`text-3xl font-bold ${primaryText}`}>{playlistName}</h1>
                  {canEdit && (
                    <button 
                      onClick={startEditingName}
                      className={`p-2 ${secondaryText} hover:text-blue-600`}
                      title="Playlist umbenennen"
                    >
                      <FiEdit2 />
                    </button>
                  )}
                </div>
              )}
              <p className={`mt-1 flex items-center gap-1 ${secondaryText}`}>
                <FiMusic className="text-sm" />
                {songs.length} {songs.length === 1 ? 'Song' : 'Songs'}
              </p>
              
              {/* Turnier-Information */}
              {turnier && (
                <p className={`mt-1 text-sm flex items-center gap-1 ${secondaryText}`}>
                  <FiCalendar className="text-sm" />
                  <Link 
                    href={`/dashboard/turniere/${turnier.id}`}
                    className={`${primaryText} hover:underline font-medium`}
                  >
                    {turnier.name}
                  </Link>
                </p>
              )}
            </div>
            
            <div className="flex gap-3">
              {canEdit && (
                <button 
                  onClick={toggleAddSongsModal}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all bg-white/90 bg-[length:0%_100%] hover:bg-[length:100%_100%] bg-gradient-to-r from-white/80 to-[#888] bg-no-repeat transition-[background-size] duration-400 shadow-md hover:shadow-lg`}
                >
                  <FiPlus className={`text-black text-lg`} />
                  <span className={`text-black`}>Songs hinzufügen</span>
                </button>
              )}
              
              <button 
                onClick={handlePlayAll}
                disabled={songs.length === 0}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all ${
                  songs.length === 0 
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-[#333] bg-[length:0%_100%] hover:bg-[length:100%_100%] bg-gradient-to-r from-white/80 to-[#888] bg-no-repeat transition-[background-size] duration-400 text-white shadow-md hover:shadow-lg transform'
                }`}
              >
                <FiPlay className="text-xl" /> 
                <span>Alle abspielen</span>
              </button>
            </div>
          </div>

          <DndContext 
            onDragEnd={canEdit ? handleDragEnd : () => {}}
            sensors={canEdit ? sensors : []}
          >
            <SortableContext 
              items={songs}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {songs.length === 0 ? (
                  <div className={`rounded-xl shadow-sm p-8 text-center border ${cardBg} ${cardBorder}`}>
                    <FiMusic className={`mx-auto text-4xl mb-4 ${secondaryText}`} />
                    <p className={`text-lg ${secondaryText}`}>
                      {canEdit ? 'Diese Playlist ist noch leer' : 'Diese Playlist enthält noch keine Songs'}
                    </p>
                    {canEdit && (
                      <button 
                        onClick={toggleAddSongsModal}
                        className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-green-600 hover:bg-green-700 text-white mx-auto"
                      >
                        <FiPlus className="text-lg" />
                        <span>Songs hinzufügen</span>
                      </button>
                    )}
                  </div>
                ) : (
                  songs.map((song) => (
                    <SortableSong
                      key={song.id}
                      song={song}
                      isPlaying={currentlyPlaying === song.path && isPlaying}
                      onPlay={() => {
                        if (currentlyPlaying === song.path && isPlaying) {
                          pauseSong();
                        } else {
                          // Der Player-Kontext sollte bereits die aktuellen Songs haben
                          // aber zur Sicherheit nochmal setzen
                          setPlayerSongs(songs);
                          playSong(song.path);
                        }
                      }}
                      onRemove={() => removeSongFromPlaylist(song.id)}
                      cardBg={cardBg}
                      cardBorder={cardBorder}
                      primaryText={primaryText}
                      secondaryText={secondaryText}
                      theme={theme}
                      canEdit={canEdit}
                    />
                  ))
                )}
              </div>
            </SortableContext>
          </DndContext>

          {/* Modal zum Hinzufügen von Songs */}
            {showAddSongsModal && canEdit && (
              <div className={`fixed inset-0 bg-opacity-50 backdrop-blur flex items-center justify-center z-50 p-4`}>
                <div className={`rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col ${cardBg} ${cardBorder}`}>
                  {/* Header mit Titel und Schließen-Button */}
                  <div className={`p-6 border-b ${cardBorder}`}>
                    <div className="flex justify-between items-center">
                      <h2 className={`text-2xl font-bold ${primaryText}`}>Songs hinzufügen</h2>
                      <button 
                        onClick={toggleAddSongsModal}
                        className={`p-2 rounded-full dark:hover:text-red-500 transition-colors ${secondaryText}`}
                      >
                        <FiX className={`text-xl`} />
                      </button>
                    </div>
                    
                    {/* Suchfeld */}
                    <div className="mt-4 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiSearch className={secondaryText} />
                      </div>
                      <input
                        type="text"
                        placeholder="Nach Songs suchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-white ${inputBorder} ${primaryText} ${inputBg}`}
                      />
                    </div>
                  </div>
                  
                  {/* Song-Liste */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {filteredAvailableSongs.length === 0 ? (
                      <div className="text-center py-8">
                        <FiMusic className={`mx-auto text-4xl mb-4 ${secondaryText}`} />
                        <p className={secondaryText}>
                          {searchTerm ? 'Keine passenden Songs gefunden' : 'Keine weiteren Songs verfügbar'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredAvailableSongs.map(song => (
                          <div 
                            key={song.id} 
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${cardBorder}`}
                            style={{
                              borderColor: selectedSongs.includes(song.id) ? 'var(--border)' : 'var(--border)',
                              borderWidth: selectedSongs.includes(song.id) ? '2px' : '1px'
                            }}
                            onClick={() => toggleSongSelection(song.id)}
                          >
                            <div className="flex items-center gap-4">
                              <input
                                type="checkbox"
                                checked={selectedSongs.includes(song.id)}
                                onChange={() => toggleSongSelection(song.id)}
                                className={`h-5 w-5 rounded ${
                                  theme === 'dark' ? 'dark:border-gray-500' : ''
                                }`}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex-grow">
                                <h3 className={`font-medium ${primaryText}`}>
                                  {song.title || song.filename.replace(/^\d+_?/, "").replace(/_/g, " ").replace(/\.(mp3|wav)$/i, "")}
                                </h3>
                                <p className={`text-sm ${secondaryText}`}>
                                  {song.artist || 'Unbekannter Künstler'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Footer mit Buttons */}
                  <div className={`p-6 border-t flex justify-end gap-3 ${cardBorder}`}>
                    <button
                      onClick={toggleAddSongsModal}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        theme === 'dark' 
                          ? 'bg-[#333] hover:bg-[#444] text-gray-100' 
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      }`}
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={addSongsToPlaylist}
                      disabled={selectedSongs.length === 0}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        selectedSongs.length === 0 
                          ? `bg-gray-200 text-gray-500 cursor-not-allowed` 
                          : 'bg-[#333] bg-[length:0%_100%] hover:bg-[length:100%_100%] bg-gradient-to-r from-white/80 to-[#888] bg-no-repeat transition-[background-size] duration-400 text-white shadow-md hover:shadow-lg transform'
                      }`}
                    >
                      {selectedSongs.length} Songs hinzufügen
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>
      </main>
    </div>
  );
}

function SortableSong({ 
  song, 
  isPlaying, 
  onPlay, 
  onRemove,
  cardBg,
  cardBorder,
  primaryText,
  secondaryText,
  theme,
  canEdit
}: { 
  song: Song; 
  isPlaying: boolean; 
  onPlay: () => void; 
  onRemove: () => void;
  cardBg: string;
  cardBorder: string;
  primaryText: string;
  secondaryText: string;
  theme: string;
  canEdit: boolean;
}) {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition,
    isDragging 
  } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    zIndex: isDragging ? 100 : 10,
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center p-2 rounded-xl transition-all ${
        isPlaying 
          ? "hologram-effect" 
          : "hover:shadow-sm"
      } ${isDragging ? 'shadow-lg' : ''} ${cardBg} ${cardBorder}`}
      style={{
        ...style,
        cursor: isDragging ? 'grabbing' : 'pointer',
        position: 'relative',
        opacity: 1,
        backgroundColor: cardBg === 'bg-[#111]' ? 'rgb(17, 17, 17)' : 'rgb(255, 255, 255)',
        border: cardBorder === 'border-[#333]' ? '1px solid #333' : '1px solid #e5e7eb',
        '--hover-shadow': cardBg === 'bg-[#111]' ? '0 10px 25px rgba(255,255,255,0.05)' : '0 10px 25px rgba(0,0,0,0.05)',
        boxShadow: 'var(--hover-shadow)'
      } as React.CSSProperties}
    >
      {canEdit && (
        <button 
          {...attributes}
          {...listeners}
          className={`p-2 rounded-full transition-colors ${
            theme === 'dark' 
              ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
              : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
          }`}
          aria-label="Drag handle"
        >
          <FiList className="text-lg" />
        </button>
      )}

      {/* Grüner Play / Roter Stop Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className={`p-2 transition-all mr-3 rounded-full border ${
            isPlaying 
              ? 'text-red-600 hover:text-red-800 border-transparent hover:border-red-800' 
              : 'text-green-600 hover:text-green-800 border-transparent hover:border-green-800'
          }`}
        >
          {isPlaying ? <FiPause className="text-lg" /> : <FiPlay className="text-lg" />}
        </button>
      
      <div className="flex-grow">
        <div className={`font-medium truncate ${primaryText}`}>
          {song.title}
        </div>
        <div className={`text-sm ${secondaryText}`}>
          {song.artist}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {canEdit && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className={`p-2 ${secondaryText} hover:text-red-500 transition-colors`}
            title="Song entfernen"
          >
            <FiTrash2 className="text-lg" />
          </button>
        )}
      </div>
    </div>
  );
}