'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { usePlayer } from '@/app/context/PlayerContent';
import { useTheme } from '@/app/components/Theme/ThemeProvider';
import Image from 'next/image';

interface CustomAudioPlayerProps {
  className?: string;
}

export default function CustomAudioPlayer({ className }: CustomAudioPlayerProps) {
  const {
    audioRef,
    currentlyPlaying,
    isPlaying,
    setIsPlaying,
    playNext,
    playPrevious,
    currentTime,
    setCurrentTime,
    songs,
    pauseSong
  } = usePlayer();

  const { theme } = useTheme();
  const progressRef = useRef<HTMLInputElement>(null);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);

  // Theme-based colors - White mode remains unchanged, dark mode uses your palette
  const buttonBg = theme === 'dark' ? 'bg-[#333] hover:bg-[#999]' : 'bg-[#333] hover:bg-[#999]';
  const playerBg = theme === 'dark' ? 'bg-black/20' : 'bg-white/90';
  const borderColor = theme === 'dark' ? 'border-[#333]' : 'border-gray-200';
  const primaryText = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const secondaryText = theme === 'dark' ? 'text-[#999]' : 'text-gray-600';
  const disabledColor = theme === 'dark' ? 'text-[#555]' : 'text-gray-400';

  // Progress bar colors - unified style with #333 in both themes
  const progressEmpty = theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300';
  const progressFilled = theme === 'dark' ? 'white' : '#333'; // Dark: weiß, Light: dunkelgrau
  const progressThumb = theme === 'dark' ? 'white' : '#333'; // Dark: weiß, Light: dunkelgrau

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      if (!isSeeking) {
        setCurrentTime(audio.currentTime);
        if (progressRef.current) {
          progressRef.current.value = String(audio.currentTime);
        }
      }
    };

    const updateDuration = () => {
      setDuration(audio.duration || 0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => playNext();

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioRef, isSeeking, playNext, setCurrentTime, setIsPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
      audio.muted = muted;
    }
  }, [volume, muted, audioRef]);

  const togglePlay = async () => {
    if (!currentlyPlaying) return;

    try {
      if (isPlaying) {
        pauseSong();
      } else {
        await audioRef.current?.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback failed:', error);
    }
  };

  const handleSeekStart = () => setIsSeeking(true);
  const handleSeekEnd = () => setIsSeeking(false);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);

    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    setMuted(vol === 0);
  };

  const toggleMute = () => {
    setMuted(!muted);
  };

  const currentSong = songs.find(s => s.path === currentlyPlaying);

  return (
    <div className={`
      fixed bottom-0 left-0 right-0 z-50
      ${playerBg}
      backdrop-blur-lg
      border-t ${borderColor}
      flex items-center justify-between
      px-4 sm:px-8 py-2
      shadow-lg
      ${className}
    `}>
      {/* Song Info */}
      <div className="flex items-center gap-3 w-1/4 min-w-[180px]">
        <div className={`
          w-12 h-12 flex-shrink-0 rounded-lg flex items-center justify-center
          ${isPlaying ? 'scale-105' : ''}
          transition-all duration-300
        `}>
          <Image 
            src="/Logo/dtvlogo.png" 
            alt="DTV Logo" 
            width={80} 
            height={80} 
            className="object-contain"
          />
        </div>
        <div className="truncate">
          <div className={`font-medium text-sm sm:text-md truncate ${primaryText}`} title={currentSong?.title}>
            {currentSong?.title || 'Kein Titel'}
          </div>
          <div className={`text-xs sm:text-sm truncate ${secondaryText}`} title={currentSong?.artist}>
            {currentSong?.artist || 'Unbekannter Künstler'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-2 sm:gap-3 w-2/4">
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={playPrevious}
            disabled={!currentlyPlaying}
            className={`${!currentlyPlaying ? disabledColor : secondaryText} hover:${primaryText} transition-colors`}
            aria-label="Vorheriger Titel"
          >
            <SkipBack size={20} />
          </button>

          <button
            onClick={togglePlay}
            disabled={!currentlyPlaying}
            className={`
              flex items-center justify-center
              w-10 h-10
              ${buttonBg}
              rounded-full
              shadow
              transition-all
              duration-200
              ${!currentlyPlaying ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={20} className="text-white" />
            ) : (
              <Play size={20} className="text-white" />
            )}
          </button>

          <button
            onClick={playNext}
            disabled={!currentlyPlaying}
            className={`${!currentlyPlaying ? disabledColor : secondaryText} hover:${primaryText} transition-colors`}
            aria-label="Nächster Titel"
          >
            <SkipForward size={20} />
          </button>
        </div>

        {/* Progress Bar - unified style with volume control */}
        <div className="flex items-center gap-2 sm:gap-3 w-full max-w-lg">
          <span className={`text-xs sm:text-sm w-12 text-right font-mono ${secondaryText}`}>
            {formatTime(currentTime)}
          </span>
          <input
            ref={progressRef}
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            onMouseDown={handleSeekStart}
            onMouseUp={handleSeekEnd}
            className={`
              w-full h-1 rounded-full cursor-pointer appearance-none
              ${progressEmpty}
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:${progressThumb}
              disabled:opacity-50
            `}
            style={{
              backgroundImage: `linear-gradient(to right, ${progressFilled} 0%, ${progressFilled} ${(duration ? (currentTime / duration) * 100 : 0)}%, transparent ${(duration ? (currentTime / duration) * 100 : 0)}%, transparent 100%)`
            }}
            disabled={!currentlyPlaying}
            aria-label="Fortschritt"
          />
          <span className={`text-xs sm:text-sm w-12 font-mono ${secondaryText}`}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume Control - jetzt identisch zur Progressbar */}
      <div className="flex items-center gap-2 sm:gap-3 w-1/4 justify-end min-w-[140px]">
        <button
          onClick={toggleMute}
          className={`${secondaryText} hover:${primaryText} transition-colors`}
          aria-label={muted ? 'Stummschalten aufheben' : 'Stummschalten'}
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          onChange={handleVolume}
          className={`
            w-20 sm:w-28 h-1 rounded-full cursor-pointer appearance-none
            ${progressEmpty}
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:w-3
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:${progressThumb}
            [&::-webkit-slider-thumb]:border-none
            [&::-moz-range-thumb]:h-3
            [&::-moz-range-thumb]:w-3
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:${progressThumb}
            [&::-moz-range-thumb]:border-none
          `}
          style={{
            backgroundImage: `linear-gradient(to right, ${progressFilled} 0%, ${progressFilled} ${(muted ? 0 : volume) * 100}%, transparent ${(muted ? 0 : volume) * 100}%, transparent 100%)`
          }}
          aria-label="Lautstärke"
        />
      </div>
    </div>
  );
}

function formatTime(time: number) {
  if (!time || isNaN(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}