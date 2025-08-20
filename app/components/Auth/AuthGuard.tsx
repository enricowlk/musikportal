"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/context/UserContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { updateUserInfo, isLoading, userId } = useUser();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Cookie-basierte Authentifizierung prüfen
        const response = await fetch('/api/auth/check');
        
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.role) {
            updateUserInfo(data.role, data.vereinId, data.verein);
            return;
          }
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
            const tokenData = await tokenResponse.json();
            if (tokenData.valid && tokenData.role) {
              // Token ist gültig, setze Cookies neu
              const verifyResponse = await fetch('/api/token/verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: localToken }),
              });
              
              if (verifyResponse.ok) {
                const verifyData = await verifyResponse.json();
                updateUserInfo(verifyData.role, verifyData.vereinId, verifyData.verein);
                return;
              }
            }
          }
        }
        
        // Nicht authentifiziert
        router.push('/');
        
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/');
      }
    };

    // Nur einmal prüfen
    checkAuth();
  }, []); // Leere dependency array für einmalige Ausführung

  // Zeige Loading während der Authentifizierung geprüft wird
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Überprüfe Anmeldung...</p>
        </div>
      </div>
    );
  }

  // Zeige Inhalt nur wenn authentifiziert (haben eine User-ID)
  if (userId) {
    return <>{children}</>;
  }

  // Zeige nichts wenn nicht authentifiziert (redirect läuft bereits)
  return null;
}
