"use client";
import 'react-h5-audio-player/lib/styles.css';
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AudioPlayer from "react-h5-audio-player";
import { FiChevronLeft, FiPlay, FiPause, FiMusic, FiList } from "react-icons/fi";
import Link from "next/link";
import NavBar from "@/app/components/Navigation/Navbar";
import { useTheme } from "@/app/components/Theme/ThemeProvider";

type Song = {
  id: string;
  filename: string;
  path: string;
  title: string;
  duration?: string;
};

export default function PlaylistDetail() {
  const { id } = useParams();
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlistName, setPlaylistName] = useState("");
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioPlayerRef = useRef<AudioPlayer>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(`/api/playlists/${id}`);
        const data = await response.json();

        setPlaylistName(data.name);
        setSongs(
          (data.songs || []).map((song: any) => ({
            ...song,
            title: song.title || song.filename,
            duration: song.duration || "",
          }))
        );
      } catch (error) {
        console.error("Fehler beim Laden:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSongs((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handlePlayAll = () => {
    if (songs.length > 0) {
      setCurrentlyPlaying(songs[0].path);
      setIsPlaying(true);
    }
  };

  const togglePlayPause = (songPath: string) => {
    if (currentlyPlaying === songPath) {
      if (isPlaying) {
        audioPlayerRef.current?.audio.current?.pause();
      } else {
        audioPlayerRef.current?.audio.current?.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      setCurrentlyPlaying(songPath);
      setIsPlaying(true);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen p-6 flex items-center justify-center" style={{ background: 'var(--background)', color: 'var(--foreground)' }} suppressHydrationWarning>
      <NavBar />
      <div className="animate-pulse flex flex-col items-center">
        <FiMusic className="text-4xl mb-4 animate-bounce" style={{ color: 'var(--foreground-alt)' }} />
        <div className="h-8 w-48 rounded-lg mb-4" style={{ background: 'var(--background-alt)' }}></div>
        <p style={{ color: 'var(--foreground-alt)' }}>Lade Playlist...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }} suppressHydrationWarning>
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <Link 
            href="/dashboard/playlists" 
            className="flex items-center gap-1 mb-6 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
            style={{ color: 'var(--primary)' }}
          >
            <FiChevronLeft className="text-lg" /> Zurück zu allen Playlists
          </Link>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 p-6 rounded-xl shadow-sm border" style={{ background: 'var(--background-alt)', color: 'var(--foreground)', borderColor: 'var(--border)' }}>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>{playlistName}</h1>
              <p className="mt-1" style={{ color: 'var(--foreground-alt)' }}>
                {songs.length} {songs.length === 1 ? 'Song' : 'Songs'}
              </p>
            </div>
            
            <button 
              onClick={handlePlayAll}
              disabled={songs.length === 0}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                songs.length === 0 
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95'
              }`}
            >
              <FiPlay className="text-xl" /> 
              <span>Alle abspielen</span>
            </button>
          </div>

          <DndContext 
            onDragEnd={handleDragEnd}
            sensors={sensors}
          >
            <SortableContext 
              items={songs}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {songs.length === 0 ? (
                  <div className="rounded-xl shadow-sm p-8 text-center border" style={{ background: 'var(--background-alt)', color: 'var(--foreground)', borderColor: 'var(--border)' }}>
                    <FiMusic className="mx-auto text-4xl mb-4" style={{ color: 'var(--foreground-alt)' }} />
                    <p className="text-lg" style={{ color: 'var(--foreground-alt)' }}>Diese Playlist ist noch leer</p>
                  </div>
                ) : (
                  songs.map((song) => (
                    <SortableSong
                      key={song.id}
                      song={song}
                      isPlaying={currentlyPlaying === song.path && isPlaying}
                      onPlay={() => togglePlayPause(song.path)}
                    />
                  ))
                )}
              </div>
            </SortableContext>
          </DndContext>

          {currentlyPlaying && (
            <div className="fixed bottom-0 left-0 right-0 border-t shadow-lg" style={{ background: 'var(--background-alt)', borderColor: 'var(--border)' }}>
              <div className="max-w-4xl mx-auto px-4">
                <AudioPlayer
                  ref={audioPlayerRef}
                  autoPlay
                  src={currentlyPlaying}
                  volume={0.7}
                  style={{ 
                    padding: "16px 0",
                    background: 'var(--background-alt)',
                    color: 'var(--foreground)',
                    boxShadow: "none"
                  }}
                  className="rounded-none"
                  showSkipControls={true}
                  showJumpControls={false}
                  onClickNext={() => {
                    if (!currentlyPlaying || songs.length === 0) return;
                    const currentIndex = songs.findIndex(song => song.path === currentlyPlaying);
                    const nextIndex = (currentIndex + 1) % songs.length;
                    setCurrentlyPlaying(songs[nextIndex].path);
                    setIsPlaying(true);
                  }}
                  onClickPrevious={() => {
                    if (!currentlyPlaying || songs.length === 0) return;
                    const currentIndex = songs.findIndex(song => song.path === currentlyPlaying);
                    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
                    setCurrentlyPlaying(songs[prevIndex].path);
                    setIsPlaying(true);
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => {
                    if (!currentlyPlaying || songs.length === 0) return;
                    const currentIndex = songs.findIndex(song => song.path === currentlyPlaying);
                    const nextIndex = (currentIndex + 1) % songs.length;
                    setCurrentlyPlaying(songs[nextIndex].path);
                    setIsPlaying(true);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SortableSong({ song, isPlaying, onPlay }: { song: Song; isPlaying: boolean; onPlay: () => void }) {
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
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center p-4 border rounded-xl transition-all ${
        isPlaying 
          ? "ring-2 ring-blue-500" 
          : "hover:shadow-sm"
      } ${isDragging ? 'shadow-lg' : ''}`}
      style={{
        ...style,
        background: isPlaying ? 'rgba(59, 130, 246, 0.08)' : 'var(--background-alt)',
        borderColor: isPlaying ? 'var(--primary, #3b82f6)' : 'var(--border)',
        color: isPlaying ? '#1e293b' : 'var(--foreground)', 
        cursor: isDragging ? 'grabbing' : 'pointer',
      }}
    >
      <button 
        {...attributes}
        {...listeners}
        className="mr-4 p-2 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
        aria-label="Drag handle"
        style={{ color: 'var(--foreground-alt)' }}
      >
        <FiList className="text-lg" />
      </button>
      
      <div className="z-1 flex-grow">
        <h3 className="font-medium" style={{ color: 'var(--foreground)' }}>
          {song.title}
        </h3>
        {song.duration && (
          <p className="text-sm mt-1" style={{ color: isPlaying ? '#475569' : 'var(--foreground-alt)' }}>
            {song.duration}
          </p>
        )}
      </div>
      
      <button 
        onClick={onPlay}
        className={`z-1 p-3 rounded-full transition-all ${
          isPlaying ? 'bg-red-100 hover:bg-red-200 text-red-600' : 'bg-green-100 hover:bg-green-200 text-green-600'
        } dark:${
          isPlaying ? 'bg-red-900/30 hover:bg-red-900/40 text-red-400' : 'bg-green-900/30 hover:bg-green-900/40 text-green-400'
        }`}
      >
        {isPlaying ? <FiPause className="text-lg" /> : <FiPlay className="text-lg" />}
      </button>
    </div>
  );
}