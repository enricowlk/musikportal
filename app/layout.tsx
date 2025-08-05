// app/layout.tsx
import { ThemeProvider } from './components/Theme/ThemeProvider';
import './globals.css';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className="h-full" suppressHydrationWarning>
      <body className="h-full transition-colors duration-200">
        <img
    src="/Logo/dtvlogoerweitert.png"
    alt="DTV Logo"
    className="fixed top-1/2 right-0 -translate-y-1/2 w-[60vw] max-w-none opacity-30 pointer-events-none z-0 dark:opacity-20"
  />

        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}