'use client';
import { usePathname } from 'next/navigation';
import { ThemeProvider } from './components/Theme/ThemeProvider';
import CustomAudioPlayer from './components/Audio/CustomAudioPlayer';
import { PlayerProvider } from './context/PlayerContent';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <ThemeProvider>
      <div className="flex flex-col min-h-screen">
        {isHomePage ? (
          <div className="flex-1">{children}</div>
        ) : (
          <PlayerProvider>
            <div className="flex-1 pb-24">{children}</div>
            <CustomAudioPlayer className="fixed bottom-0 left-0 right-0" />
          </PlayerProvider>
        )}
      </div>
    </ThemeProvider>
  );
}