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
      <body className="h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}