// app/context/AudioPlayerContext.tsx
"use client"

import { createContext, useContext, useState, useRef, ReactNode, useEffect } from "react"
import AudioPlayer from "react-h5-audio-player"
import "react-h5-audio-player/lib/styles.css"
import { FiMusic } from "react-icons/fi"

type Song = {
  id: string
  path: string
  title?: string
  duration?: string
  filename?: string
}

type AudioPlayerContextType = {
  currentSong: Song | null
  isPlaying: boolean
  playSong: (song: Song) => void
  togglePlayPause: () => void
  playNext: () => void
  playPrevious: () => void
  queue: Song[]
  addToQueue: (songs: Song[]) => void
  clearQueue: () => void
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined)

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [queue, setQueue] = useState<Song[]>([])
  const audioPlayerRef = useRef<AudioPlayer>(null)

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('audioPlayerState')
    if (savedState) {
      const { currentSong, queue } = JSON.parse(savedState)
      setCurrentSong(currentSong)
      setQueue(queue)
    }
  }, [])

  // Save state to localStorage on change
  useEffect(() => {
    if (currentSong || queue.length > 0) {
      localStorage.setItem('audioPlayerState', JSON.stringify({ currentSong, queue }))
    }
  }, [currentSong, queue])

  const playSong = (song: Song) => {
    setCurrentSong(song)
    setIsPlaying(true)
  }

  const addToQueue = (songs: Song[]) => {
    setQueue(prev => [...prev, ...songs])
  }

  const clearQueue = () => {
    setQueue([])
  }

  const togglePlayPause = () => {
    if (isPlaying) {
      audioPlayerRef.current?.audio.current?.pause()
    } else {
      audioPlayerRef.current?.audio.current?.play()
    }
    setIsPlaying(!isPlaying)
  }

  const playNext = () => {
    if (queue.length > 0) {
      const nextSong = queue[0]
      setCurrentSong(nextSong)
      setQueue(prev => prev.slice(1))
      setIsPlaying(true)
    }
  }

  const playPrevious = () => {
    // Implement previous song logic if needed
  }

  return (
    <AudioPlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        playSong,
        togglePlayPause,
        playNext,
        playPrevious,
        queue,
        addToQueue,
        clearQueue,
      }}
    >
      {children}
      
      {/* Global Audio Player */}
      {currentSong && (
        <div className="fixed bottom-0 left-0 right-0 border-t shadow-lg" style={{ 
          background: 'var(--background-alt)', 
          borderColor: 'var(--border)',
          zIndex: 1000
        }}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-4 py-2">
              <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                <FiMusic className="text-xl" />
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="font-medium truncate" style={{ color: 'var(--foreground)' }}>
                  {currentSong.title || currentSong.filename?.replace(/^\d+_/, "").replace(/\.(mp3|wav)$/i, "")}
                </h4>
                {currentSong.duration && (
                  <p className="text-xs" style={{ color: 'var(--foreground-alt)' }}>
                    {currentSong.duration}
                  </p>
                )}
              </div>
            </div>
            
            <AudioPlayer
              ref={audioPlayerRef}
              autoPlay
              src={currentSong.path}
              volume={0.7}
              style={{ 
                padding: "8px 0 16px 0",
                background: 'transparent',
                color: 'var(--foreground)',
                boxShadow: "none"
              }}
              className="rounded-none border-none"
              showSkipControls={true}
              showJumpControls={false}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onClickNext={playNext}
              onEnded={playNext}
            />
          </div>
        </div>
      )}
    </AudioPlayerContext.Provider>
  )
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext)
  if (context === undefined) {
    throw new Error("useAudioPlayer must be used within a AudioPlayerProvider")
  }
  return context
}