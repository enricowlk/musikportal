'use client';
import { useState } from 'react';
import { FiEdit2, FiCheck, FiX, FiMusic, FiUser, FiDisc } from 'react-icons/fi';

interface AudioMetadata {
  originalTitle?: string | null;
  extractedTitle: string;
  originalArtist?: string | null;
  extractedArtist: string;
  extractedTrack: string;
  album: string;
  duration: number;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  genre: string;
  year: number;
}

interface MetadataPreviewProps {
  filename: string;
  metadata: AudioMetadata;
  onMetadataChange?: (filename: string, newMetadata: Partial<AudioMetadata>) => void;
}

export default function MetadataPreview({ filename, metadata, onMetadataChange }: MetadataPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMetadata, setEditedMetadata] = useState<Partial<AudioMetadata>>({});

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    if (onMetadataChange) {
      onMetadataChange(filename, editedMetadata);
    }
    setIsEditing(false);
    setEditedMetadata({});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedMetadata({});
  };

  const getCurrentValue = (field: keyof AudioMetadata) => {
    return editedMetadata[field] ?? metadata[field];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FiMusic className="text-blue-500" />
          Metadaten-Preview
        </h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
          >
            <FiEdit2 size={14} />
            Bearbeiten
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm"
            >
              <FiCheck size={14} />
              Speichern
            </button>
            <button
              onClick={handleCancel}
              className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm"
            >
              <FiX size={14} />
              Abbrechen
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {/* Titel */}
        <div className="flex items-start gap-3">
          <FiMusic className="text-gray-400 mt-1" size={16} />
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Titel
            </label>
            {isEditing ? (
              <input
                type="text"
                value={getCurrentValue('extractedTitle') as string}
                onChange={(e) => setEditedMetadata(prev => ({ ...prev, extractedTitle: e.target.value }))}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
              />
            ) : (
              <p className="text-sm text-gray-900 dark:text-white">
                {getCurrentValue('extractedTitle')}
                {metadata.originalTitle && metadata.originalTitle !== metadata.extractedTitle && (
                  <span className="text-xs text-gray-500 block">
                    Original: {metadata.originalTitle}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Künstler */}
        <div className="flex items-start gap-3">
          <FiUser className="text-gray-400 mt-1" size={16} />
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Künstler
            </label>
            {isEditing ? (
              <input
                type="text"
                value={getCurrentValue('extractedArtist') as string}
                onChange={(e) => setEditedMetadata(prev => ({ ...prev, extractedArtist: e.target.value }))}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
              />
            ) : (
              <p className="text-sm text-gray-900 dark:text-white">
                {getCurrentValue('extractedArtist')}
                {metadata.originalArtist && metadata.originalArtist !== metadata.extractedArtist && (
                  <span className="text-xs text-gray-500 block">
                    Original: {metadata.originalArtist}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Album */}
        <div className="flex items-start gap-3">
          <FiDisc className="text-gray-400 mt-1" size={16} />
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Album
            </label>
            {isEditing ? (
              <input
                type="text"
                value={getCurrentValue('album') as string}
                onChange={(e) => setEditedMetadata(prev => ({ ...prev, album: e.target.value }))}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
              />
            ) : (
              <p className="text-sm text-gray-900 dark:text-white">{getCurrentValue('album')}</p>
            )}
          </div>
        </div>

        {/* Technische Details */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div>
              <span className="font-medium">Dauer:</span> {formatDuration(metadata.duration)}
            </div>
            <div>
              <span className="font-medium">Genre:</span> {metadata.genre}
            </div>
            {metadata.bitrate && (
              <div>
                <span className="font-medium">Bitrate:</span> {Math.round(metadata.bitrate)} kbps
              </div>
            )}
            {metadata.sampleRate && (
              <div>
                <span className="font-medium">Sample Rate:</span> {metadata.sampleRate} Hz
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
