"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FiCalendar, FiMapPin, FiUsers, FiSearch, FiClock } from "react-icons/fi";
import NavBar from "../components/Navigation/Navbar";
import { useTheme } from "../components/Theme/ThemeProvider";
import { Turnier } from "../types";

export default function Dashboard() {
  const [turniere, setTurniere] = useState<Turnier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const loadTurniere = async () => {
      try {
        const response = await fetch("/api/turniere?status=anstehend");
        const data = await response.json();
        setTurniere(data);
      } catch (error) {
        console.error("Fehler beim Laden der Turniere:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTurniere();
  }, []);

  const filteredTurniere = turniere.filter(turnier =>
    turnier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    turnier.ort.toLowerCase().includes(searchTerm.toLowerCase()) ||
    turnier.veranstalter.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isUpcoming = (dateString: string) => {
    const turnierDate = new Date(dateString);
    const today = new Date();
    const diffTime = turnierDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Theme-basierte Styling
  const cardBg = theme === 'dark' ? 'bg-black/80 backdrop-blur-md' : 'bg-white/80 backdrop-blur-md';
  const cardBorder = theme === 'dark' ? 'border-[#333]' : 'border-gray-200';
  const inputBg = theme === 'dark' ? 'bg-black' : 'bg-white';
  const inputBorder = theme === 'dark' ? 'border-[#333]' : 'border-gray-300';
  const inputFocus = theme === 'dark' ? 'focus:ring-gray-500 focus:border-gray-500' : 'focus:ring-gray-400 focus:border-gray-400';
  const badgeBg = theme === 'dark' ? 'bg-[#111] border-[#333] text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-700';
  const textSecondary = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }} suppressHydrationWarning>
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Dashboard</h1>
          <p className={textSecondary}>Übersicht über anstehende Turniere</p>
        </div>

        {/* Suchleiste */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Turniere suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg ${inputBg} ${inputBorder} ${inputFocus} transition-colors`}
              style={{ color: 'var(--foreground)' }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`p-6 rounded-lg border animate-pulse ${cardBg} ${cardBorder}`}>
                <div className="h-6 bg-gray-300 rounded mb-3"></div>
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : filteredTurniere.length === 0 ? (
          <div className="text-center py-12">
            <FiCalendar className="mx-auto text-6xl mb-4" style={{ color: 'var(--foreground-alt)' }} />
            <h3 className="text-xl font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              {searchTerm ? 'Keine Turniere gefunden' : 'Keine anstehenden Turniere'}
            </h3>
            <p className={textSecondary}>
              {searchTerm ? 'Versuchen Sie einen anderen Suchbegriff.' : 'Derzeit sind keine Turniere geplant.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTurniere.map((turnier) => {
              const daysUntil = isUpcoming(turnier.datum);
              
              return (
                <Link key={turnier.id} href={`/dashboard/turniere/${turnier.id}`}>
                  <div className={`p-6 rounded-lg border transition-all duration-200 hover:shadow-lg cursor-pointer z-10 relative ${cardBg} ${cardBorder}`}
                       style={{ 
                         '--hover-shadow': theme === 'dark' ? '0 10px 25px rgba(255,255,255,0.1)' : '0 10px 25px rgba(0,0,0,0.1)',
                         boxShadow: 'var(--hover-shadow)'
                       } as any}>
                    
                    {/* Status Badge */}
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${badgeBg}`}>
                        {turnier.status === 'anstehend' ? 'Anstehend' : 
                         turnier.status === 'laufend' ? 'Läuft' : 'Abgeschlossen'}
                      </span>
                      {daysUntil >= 0 && (
                        <span className={`text-xs ${textSecondary} flex items-center gap-1`}>
                          <FiClock size={12} />
                          {daysUntil === 0 ? 'Heute' : 
                           daysUntil === 1 ? 'Morgen' : 
                           `in ${daysUntil} Tagen`}
                        </span>
                      )}
                    </div>

                    {/* Turnier Info */}
                    <h3 className="text-lg font-semibold mb-3 line-clamp-2" style={{ color: 'var(--foreground)' }}>
                      {turnier.name}
                    </h3>

                    <div className="space-y-2">
                      <div className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                        <FiCalendar size={16} />
                        <span>{formatDate(turnier.datum)}</span>
                      </div>
                      
                      <div className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                        <FiMapPin size={16} />
                        <span>{turnier.ort}</span>
                      </div>
                      
                      <div className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                        <FiUsers size={16} />
                        <span>{turnier.veranstalter}</span>
                      </div>
                    </div>

                    {turnier.beschreibung && (
                      <p className={`mt-3 text-sm line-clamp-2 ${textSecondary}`}>
                        {turnier.beschreibung}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}