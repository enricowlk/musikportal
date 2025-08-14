import './globals.css';
import { ClientLayout } from './ClientLayout';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full" suppressHydrationWarning>
      <body className="h-full flex flex-col transition-colors duration-200">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}