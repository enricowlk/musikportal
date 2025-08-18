'use client';

import { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Song } from '@/app/types';

type PlayerContextType = {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  currentlyPlaying: string | null;
  songs: Song[];
  setSongs: (songs: Song[]) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  playSong: (src: string) => void;
  pauseSong: () => void;
  playNext: () => void;
  playPrevious: () => void;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  // Load state from LocalStorage (but NOT the songs list)
  useEffect(() => {
    const savedState = localStorage.getItem('playerState');
    if (savedState) {
      try {
        const { currentlyPlaying, currentTime } = JSON.parse(savedState);
        setCurrentlyPlaying(currentlyPlaying);
        setIsPlaying(false); // Always start with stopped state
        setCurrentTime(currentTime || 0);
      } catch (error) {
        console.error('Error loading player state:', error);
      }
    }
    setHasLoadedFromStorage(true);
  }, []);

  // Save state to LocalStorage (but NOT the songs list - songs are managed by playlists)
  useEffect(() => {
    if (hasLoadedFromStorage) {
      localStorage.setItem(
        'playerState',
        JSON.stringify({ currentlyPlaying, isPlaying: false, currentTime }) // Don't persist playing state
      );
    }
  }, [currentlyPlaying, currentTime, hasLoadedFromStorage]);

  const pauseSong = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.pause();
    setIsPlaying(false);
  }, []);

  const playSong = useCallback(async (src: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Wenn der gleiche Song bereits spielt, pausieren
    if (currentlyPlaying === src && isPlaying) {
      pauseSong();
      return;
    }
    
    try {
      // Wenn ein anderer Song spielt, diesen stoppen
      if (currentlyPlaying && currentlyPlaying !== src) {
        audio.pause();
        audio.currentTime = 0;
      }
      
      audio.src = src;
      await audio.play();
      setCurrentlyPlaying(src);
      setIsPlaying(true);
    } catch (error) {
      console.error('Playback failed:', error);
      setIsPlaying(false);
    }
  }, [currentlyPlaying, isPlaying, pauseSong]);

  // Enhanced setSongs function that ensures proper updating
  const updateSongs = useCallback((newSongs: Song[]) => {
    setSongs(newSongs);
  }, []);

  const playNext = useCallback(() => {
    if (!currentlyPlaying || songs.length === 0) return;
    const currentIndex = songs.findIndex(song => song.path === currentlyPlaying);
    const nextIndex = (currentIndex + 1) % songs.length;
    playSong(songs[nextIndex].path);
  }, [currentlyPlaying, songs, playSong]);

  const playPrevious = useCallback(() => {
    if (!currentlyPlaying || songs.length === 0) return;
    const currentIndex = songs.findIndex(song => song.path === currentlyPlaying);
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    playSong(songs[prevIndex].path);
  }, [currentlyPlaying, songs, playSong]);

  // Bereinigung beim Unmount
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        audioRef,
        currentlyPlaying,
        songs,
        setSongs: updateSongs,
        isPlaying,
        setIsPlaying,
        currentTime,
        setCurrentTime,
        playSong,
        pauseSong,
        playNext,
        playPrevious
      }}
    >
      {children}
      <audio ref={audioRef} preload="none" />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within a PlayerProvider');
  return ctx;
}