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
          id="dtv-background-logo-light"
          src="/Logo/dtvlogoerweitert.png"
          alt="DTV Logo Light"
          className="dtv-logo block dark:hidden"
        />
        <img
          id="dtv-background-logo-dark"
          src="/Logo/dtvlogoerweitert.png"
          alt="DTV Logo Dark"
          className="dtv-logo hidden dark:block"
        />
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}