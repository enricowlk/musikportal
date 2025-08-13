// app/page.tsx
import NavBar from "../components/Navigation/Navbar";

export default function Home() {

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }} suppressHydrationWarning>
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>Willkommen beim Musikportal</h1>
        </div>

      </main>
    </div>
  );
}