"use client";
import { useState, useCallback, useRef } from "react";
import { FiUpload, FiX, FiCheck, FiMusic, FiCloud, FiCopy } from "react-icons/fi";
import { useRouter } from "next/navigation";
import NavBar from "@/app/components/Navigation/Navbar";

interface DuplicateInfo {
  similarity: number;
  similarFile: string;
  duplicateType: 'exact' | 'similar' | 'duration';
}

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<Record<string, "pending" | "success" | "error" | "duplicate">>({});
  const [duplicateInfo, setDuplicateInfo] = useState<Record<string, DuplicateInfo>>({});
  const [dragActive, setDragActive] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Drag & Drop Handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    handleDrag(e);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, [handleDrag]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    handleDrag(e);
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setDragActive(false);
    }
  }, [handleDrag]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    handleDrag(e);
    setDragActive(false);
    const maxSize = 20 * 1024 * 1024; // 20MB
    const newFiles = Array.from(e.dataTransfer.files)
      .filter(file => {
        if (!file.type.includes("audio")) {
          alert(`${file.name} ist keine Audio-Datei`);
          return false;
        }
        if (file.size > maxSize) {
          alert(`${file.name} ist zu groß (max. 20MB)`);
          return false;
        }
        return true;
      });
    if (newFiles.length) {
      setFiles(prev => {
        const existingNames = new Set(prev.map(f => f.name));
        return [...prev, ...newFiles.filter(f => !existingNames.has(f.name))];
      });
    }
  }, [handleDrag]);

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const uploadFiles = async () => {
    const newStatus: typeof uploadStatus = {};
    files.forEach((file) => (newStatus[file.name] = "pending"));
    setUploadStatus(newStatus);

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const responseData = await res.json();

        if (res.ok) {
          setUploadStatus((prev) => ({
            ...prev,
            [file.name]: "success",
          }));
          setUploadedFiles((prev) => [...prev, file]);
          setFiles((prev) => prev.filter((f) => f.name !== file.name));
          setUploadStatus((prev) => {
            const copy = { ...prev };
            delete copy[file.name];
            return copy;
          });
        } else if (res.status === 409) {
          // Duplikat gefunden
          setUploadStatus((prev) => ({
            ...prev,
            [file.name]: "duplicate",
          }));
          setDuplicateInfo((prev) => ({
            ...prev,
            [file.name]: responseData
          }));
        } else {
          setUploadStatus((prev) => ({
            ...prev,
            [file.name]: "error",
          }));
        }
      }
      router.refresh();
    } catch (error) {
      console.error("Upload fehlgeschlagen:", error);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }} suppressHydrationWarning>
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col items-center">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <FiUpload className="text-3xl text-blue-500 mb-3" />
            <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Musik hochladen</h1>
          </div>
          
          {/* Dropzone */}
          <div className="w-full max-w-2xl">
            <div
              ref={dropZoneRef}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 rounded-xl p-8 mb-8 cursor-pointer transition-all duration-200 w-full rounded-xl shadow-sm p-8 border ${
                dragActive
                  ? "border-blue-500 bg-blue-50 shadow-lg"
                  : "border-dashed border-gray-300 hover:border-blue-300"
              }`}
              style={{ background: 'var(--background)', color: 'var(--foreground)', borderColor: dragActive ? 'var(--primary)' : 'var(--border)' }}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              {/* Drag Active Overlay */}
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                dragActive ? "opacity-100" : "opacity-0"
              }`}>
                <div className="text-center p-6 rounded-lg shadow-sm border" style={{ background: 'var(--background-alt)', color: 'var(--foreground)' }}>
                  <FiCloud className="mx-auto text-4xl text-blue-500 mb-3 animate-bounce" />
                  <p className="font-medium text-blue-600">Dateien hier loslassen</p>
                </div>
              </div>

              {/* Normal Content */}
              <div className={`transition-opacity duration-300 flex flex-col items-center ${
                dragActive ? "opacity-0" : "opacity-100"
              }`}>
                <div className="p-4 rounded-full" style={{ background: 'var(--background-alt)', color: 'var(--primary)' }}>
                  <FiUpload className="text-2xl text-blue-500" />
                </div>
                <p className="mt-3 text-center" style={{ color: 'var(--foreground-alt)' }}>
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>Dateien hierher ziehen</span> oder{' '}
                  <label htmlFor="file-upload" className="cursor-pointer font-medium" style={{ color: 'var(--primary)' }}>
                    vom Computer auswählen
                  </label>
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--foreground-alt)' }}>Unterstützte Formate: .mp3, .wav</p>
              </div>

              <input
                type="file"
                multiple
                accept=".mp3,.wav"
                onChange={(e) => {
                  const newFiles = Array.from(e.target.files || []);
                  setFiles(prev => {
                    const existingNames = new Set(prev.map(f => f.name));
                    return [...prev, ...newFiles.filter(f => !existingNames.has(f.name))];
                  });
                }}
                className="hidden"
                id="file-upload"
              />
            </div>

            {/* Ausgewählte Dateien */}
            {files.length > 0 && (
              <div className="flex flex-col items-center">
                <div className="z-1 space-y-4 mb-8 w-full">
                  <h2 className="font-semibold text-lg text-center" style={{ color: 'var(--foreground)' }}>
                    Ausgewählte Dateien <span className="text-blue-500">({files.length})</span>
                  </h2>
                  <div className="space-y-3">
                    {files.map(file => (
                      <div 
                        key={file.name} 
                        className={`rounded-xl p-4 flex justify-between items-center transition-all border`}
                        style={{
                          background: 'var(--background-alt)',
                          borderColor: 'var(--border)',
                          color: 'var(--foreground)'
                        }}
                      >
                        <div className="flex items-center gap-3 flex-grow">
                          <FiMusic className="text-lg" style={{ color: 'var(--foreground)' }} />
                          <div className="min-w-0">
                            <p className="font-medium truncate" style={{ color: 'var(--foreground)' }}>{file.name}</p>
                            <div className="text-xs" style={{ color: 'var(--foreground-alt)' }}>
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                              {/* Status-Anzeige */}
                              {uploadStatus[file.name] === "pending" && (
                                <span className="ml-2 text-blue-500">Wird hochgeladen...</span>
                              )}
                              {uploadStatus[file.name] === "error" && (
                                <span className="ml-2 text-red-500">Fehler beim Upload</span>
                              )}
                              {uploadStatus[file.name] === "duplicate" && duplicateInfo[file.name] && (
                                <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                  <div className="flex items-center gap-1 text-yellow-800">
                                    <FiCopy size={12} />
                                    <span className="font-medium">Duplikat gefunden ({duplicateInfo[file.name].similarity}% ähnlich)</span>
                                  </div>
                                  <div className="text-yellow-700 mt-1">
                                    Ähnliche Datei: &quot;{duplicateInfo[file.name].similarFile}&quot;
                                  </div>
                                  <div className="text-yellow-600 text-xs mt-1">
                                    Typ: {duplicateInfo[file.name].duplicateType === 'exact' ? 'Exakte Übereinstimmung' : 
                                          duplicateInfo[file.name].duplicateType === 'similar' ? 'Ähnlicher Inhalt' : 
                                          'Ähnliche Dauer'}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeFile(file.name)}
                          className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                        >
                          <FiX className="text-lg" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upload Button */}
                <div className="w-full">
                  <button
                    onClick={uploadFiles}
                    disabled={files.length === 0 || Object.values(uploadStatus).some(status => status === "pending")}
                    className={`w-full py-3 px-6 rounded-xl font-medium transition-all ${
                      Object.values(uploadStatus).some(status => status === "pending")
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg"
                    } flex items-center justify-center gap-2`}
                  >
                    {Object.values(uploadStatus).some(status => status === "pending") ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Upload läuft...
                      </>
                    ) : (
                      <>
                        <FiUpload /> Hochladen starten
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Hochgeladene Dateien */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-col items-center mt-8">
                <div className="z-1 space-y-4 mb-8 w-full">
                  <h2 className="font-semibold text-lg text-center" style={{ color: 'var(--foreground)' }}>
                    Hochgeladene Dateien <span className="text-green-500">({uploadedFiles.length})</span>
                  </h2>
                  <div className="space-y-3">
                    {uploadedFiles.map(file => (
                      <div 
                        key={file.name} 
                        className={`rounded-xl p-4 flex justify-between items-center transition-all border`}
                        style={{
                          background: 'var(--success-bg, #22c55e22)',
                          borderColor: '#22c55e',
                          color: 'var(--foreground)'
                        }}
                      >
                        <div className="flex items-center gap-3 flex-grow">
                          <FiMusic className="text-lg" style={{ color: '#22c55e' }} />
                          <div className="min-w-0">
                            <p className="font-medium truncate" style={{ color: 'var(--foreground)' }}>{file.name}</p>
                            <div className="text-xs" style={{ color: 'var(--foreground-alt)' }}>
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                              <span style={{ color: '#22c55e' }} className="ml-2">Erfolgreich hochgeladen</span>
                            </div>
                          </div>
                        </div>
                        <FiCheck className="text-2xl text-green-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}