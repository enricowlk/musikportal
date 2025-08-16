"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Erst Cookie-basierte Authentifizierung prüfen
        const response = await fetch('/api/auth/check');
        
        if (response.ok) {
          setIsAuthenticated(true);
          return;
        }
        
        // Fallback: localStorage prüfen (für macOS)
        const localToken = localStorage.getItem('auth-token');
        if (localToken) {
          const tokenResponse = await fetch('/api/token/validate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: localToken }),
          });
          
          if (tokenResponse.ok) {
            // Token ist gültig, setze Cookies neu
            const verifyResponse = await fetch('/api/token/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ token: localToken }),
            });
            
            if (verifyResponse.ok) {
              setIsAuthenticated(true);
              return;
            }
          }
        }
        
        // Nicht authentifiziert
        setIsAuthenticated(false);
        router.push('/');
        
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  // Zeige Loading während der Authentifizierung geprüft wird
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Überprüfe Anmeldung...</p>
        </div>
      </div>
    );
  }

  // Zeige Inhalt nur wenn authentifiziert
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Zeige nichts wenn nicht authentifiziert (redirect läuft bereits)
  return null;
}
