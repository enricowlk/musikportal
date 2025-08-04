// app/dashboard/playlists/[id]/page.tsx
"use client";
import 'react-h5-audio-player/lib/styles.css';
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable } from "@dnd-kit/sortable";
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
  const { theme } = useTheme();
  const { id } = useParams();
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlistName, setPlaylistName] = useState("");
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch playlist data from your API/backend
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

  if (isLoading) return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <NavBar />
      <div className="animate-pulse flex flex-col items-center">
        <FiMusic className="text-4xl text-gray-300 dark:text-gray-600 mb-4 animate-bounce" />
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
        <p className="text-gray-400 dark:text-gray-300">Lade Playlist...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header mit Back-Button */}
        <Link 
          href="/dashboard/playlists" 
          className="flex items-center gap-1 text-blue-500 dark:text-blue-300 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
        >
          <FiChevronLeft className="text-lg" /> Zurück zu allen Playlists
        </Link>

        {/* Playlist-Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{playlistName}</h1>
            <p className="text-gray-500 dark:text-gray-300 mt-1">
              {songs.length} {songs.length === 1 ? 'Song' : 'Songs'}
            </p>
          </div>
          <button 
            onClick={() => setCurrentlyPlaying(songs[0]?.path || null)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-900 text-white px-5 py-2.5 rounded-lg hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-800 dark:hover:to-blue-950 transition-all shadow-md"
          >
            <FiPlay /> Alle abspielen
          </button>
        </div>

        {/* Song-Liste */}
        <DndContext onDragEnd={handleDragEnd}>
          <SortableContext items={songs}>
            <div className="space-y-3">
              {songs.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center border border-gray-100 dark:border-gray-700">
                  <FiMusic className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-300 text-lg">Diese Playlist ist noch leer</p>
                </div>
              ) : (
                songs.map((song) => (
                  <SortableSong
                    key={song.id}
                    song={song}
                    isPlaying={currentlyPlaying === song.path}
                    onPlay={() => setCurrentlyPlaying(song.path)}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>

        {/* Audio-Player */}
        {currentlyPlaying && (
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg">
            <div className="max-w-4xl mx-auto px-4">
              <AudioPlayer
                autoPlay
                src={currentlyPlaying}
                volume={0.7}
                style={{ 
                  padding: "16px 0",
                  backgroundColor: theme === "dark" ? "#1a202c" : "white",
                  color: theme === "dark" ? "#f3f4f6" : "#1a202c",
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
                }}
                onClickPrevious={() => {
                  if (!currentlyPlaying || songs.length === 0) return;
                  const currentIndex = songs.findIndex(song => song.path === currentlyPlaying);
                  const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
                  setCurrentlyPlaying(songs[prevIndex].path);
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
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center p-4 border rounded-xl transition-all ${
        isPlaying 
          ? "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border-blue-200 dark:border-blue-700 shadow-sm" 
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-400 hover:shadow-sm"
      }`}
    >
      <button 
        {...attributes}
        {...listeners}
        className="mr-4 p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 cursor-grab rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Drag handle"
      >
        <FiList className="text-lg" />
      </button>
      
      <div className="flex-grow">
        <h3 className="font-medium text-gray-800 dark:text-gray-100">{song.title}</h3>
        {song.duration && (
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">{song.duration}</p>
        )}
      </div>
      
      <button 
        onClick={onPlay}
        className={`p-3 rounded-full ${
          isPlaying 
            ? "bg-red-100 dark:bg-red-900 text-red-500 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800" 
            : "bg-green-100 dark:bg-green-900 text-green-500 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800"
        } transition-colors`}
      >
        {isPlaying ? <FiPause className="text-lg" /> : <FiPlay className="text-lg" />}
      </button>
    </div>
  );
}