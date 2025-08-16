"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTheme } from "./components/Theme/ThemeProvider";

export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [vereinName, setVereinName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setVereinName("");
    
    const token = (e.currentTarget as HTMLFormElement).token.value;

    try {
      const res = await fetch('/api/token/verify', {
        method: 'POST',
        body: JSON.stringify({ token }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setVereinName(data.verein);
        
        // Zusätzlich auch in localStorage speichern als Fallback für macOS
        try {
          localStorage.setItem('auth-token', token);
          localStorage.setItem('verein-info', JSON.stringify({
            id: data.vereinId,
            name: data.verein
          }));
        } catch (e) {
          console.warn('localStorage not available:', e);
        }
        
        // Kurz den Vereinsnamen anzeigen, dann weiterleiten
        setTimeout(() => {
          // Fallback für macOS/Safari: versuche window.location falls router.push nicht funktioniert
          try {
            router.push("/dashboard");
            // Zusätzlicher Fallback nach kurzer Zeit
            setTimeout(() => {
              if (window.location.pathname !== "/dashboard") {
                window.location.href = "/dashboard";
              }
            }, 500);
          } catch {
            // Direkte Navigation als Fallback
            window.location.href = "/dashboard";
          }
        }, 1500);
      } else {
        setError(data.error || "Ungültiger Token. Bitte wenden Sie sich an Ihren Vereinsvorstand.");
      }
    } catch {
      setError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)', color: 'var(--foreground)' }} suppressHydrationWarning>
      <main className="max-w-md mx-auto px-10 sm:px-6 lg:px-8 py-6 z-10">
        <form onSubmit={handleSubmit} className="p-8 rounded-lg shadow-lg" style={{ 
          background: 'var(--background)', 
          color: 'var(--foreground)', 
          '--hover-shadow': theme === 'dark' ? '0 10px 25px rgba(255,255,255,0.1)' : '0 10px 25px rgba(0,0,0,0.1)',
          boxShadow: 'var(--hover-shadow)',
          border: theme === 'dark' ? '1px solid #333' : '1px solid #e5e7eb'
        } as React.CSSProperties}>
          
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              Musikportal
            </h1>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded bg-red-100 border border-red-300 text-red-700 text-sm">
              {error}
            </div>
          )}

          {vereinName && (
            <div className="mb-4 p-3 rounded bg-green-100 border border-green-300 text-green-700 text-sm text-center">
              ✓ Willkommen, {vereinName}! <br />
              <span className="text-xs">Weiterleitung...</span>
              <br />
              <button 
                onClick={() => {
                  try {
                    router.push("/dashboard");
                    setTimeout(() => {
                      if (window.location.pathname !== "/dashboard") {
                        window.location.href = "/dashboard";
                      }
                    }, 200);
                  } catch {
                    window.location.href = "/dashboard";
                  }
                }}
                className="mt-2 text-xs underline hover:no-underline text-green-800"
              >
                Hier klicken falls keine automatische Weiterleitung erfolgt
              </button>
            </div>
          )}

          <div className="mb-4">
            <input
              name="token"
              type="password"
              placeholder="Vereins-Token eingeben"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isLoading}
              style={{ 
                color: 'var(--foreground)',
                backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
                borderColor: theme === 'dark' ? '#333' : '#d1d5db'
              }}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`z-1 items-center gap-2 text-white px-5 py-2.5 rounded-lg transition-all shadow-md bg-[#333] bg-[length:0%_100%] hover:bg-[length:100%_100%] bg-gradient-to-r from-white/80 to-[#888] bg-no-repeat transition-[background-size] duration-400 w-full rounded ${
              isLoading 
                ? 'cursor-not-allowed' 
                : ''
            } text-white`}
          >
            {isLoading ? 'Überprüfe Token...' : 'Zugang erhalten'}
          </button>

          <div className="mt-6 text-xs text-center opacity-60">
            <p>Benötigen Sie einen Token?</p>
            <p>Wenden Sie sich an Ihren Vereinsvorstand.</p>
          </div>
        </form>
      </main>
    </div>
  );
}