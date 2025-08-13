import './globals.css';
import { ClientLayout } from './ClientLayout';
import Image from 'next/image';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full" suppressHydrationWarning>
      <body className="h-full flex flex-col transition-colors duration-200">
        <Image
          src="/Logo/dtvlogoerweitert.png"
          alt="DTV Logo"
          width={800}
          height={400}
          className="fixed top-1/2 right-10 -translate-y-1/2 w-[45vw] max-w-none pointer-events-none z-0 dark:opacity-80"
          priority
        />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}