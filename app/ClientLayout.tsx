'use client';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { ThemeProvider, useTheme } from './components/Theme/ThemeProvider';
import CustomAudioPlayer from './components/Audio/CustomAudioPlayer';
import { PlayerProvider } from './context/PlayerContent';
import { UserProvider } from './context/UserContext';

function BackgroundLogo() {
  const { theme } = useTheme();
  
  if (theme === 'dark') {
    return (
      <Image
        src="/Logo/dtvlogoWeiß.png"
        alt="DTV Logo"
        width={800}
        height={400}
        className=" fixed top-1/2 right-10 -translate-y-1/2 h-[35vh] object-contain pointer-events-none"
        priority
      />
    );
  } else {
    return (
      <Image
        src="/Logo/dtvlogoSchwarz.png"
        alt="DTV Logo"
        width={800}
        height={400}
        className="fixed top-1/2 right-10 -translate-y-1/2 h-[30vh] object-contain pointer-events-none"
        priority
      />
    );
  }
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <ThemeProvider>
      <UserProvider>
        <BackgroundLogo />
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
      </UserProvider>
    </ThemeProvider>
  );
}