// app/page.tsx
import { FiMusic, FiList, FiUpload, FiShuffle } from "react-icons/fi";
import NavBar from "../components/Navigation/Navbar";

export default function Home() {
  const features = [
    {
      icon: <FiMusic className="text-3xl mb-4 text-blue-500" />,
      title: "Playlist Management",
      description: "Erstelle und verwalte deine Tanzmusik-Playlists",
      link: "/dashboard/playlists"
    },
    {
      icon: <FiUpload className="text-3xl mb-4 text-green-500" />,
      title: "Einfacher Upload",
      description: "Lade neue Musikdateien einfach per Drag & Drop hoch",
      link: "/dashboard/upload"
    },
    {
      icon: <FiShuffle className="text-3xl mb-4 text-purple-500" />,
      title: "...",
      description: "In Progress",
      link: "/dashboard/playlists"
    }
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }} suppressHydrationWarning>
      <NavBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>Willkommen beim Musikportal</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="z-1 rounded-xl shadow-sm p-8 border hover:shadow-md transition-shadow"
              style={{ background: 'var(--background)', color: 'var(--foreground)', borderColor: 'var(--border)' }}
            >
              <div className="text-center">
                {feature.icon}
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="mb-4" style={{ color: 'var(--foreground-alt)' }}>{feature.description}</p>
                <a 
                  href={feature.link} 
                  className="inline-block px-4 py-2 rounded-lg transition-colors"
                  style={{ background: 'var(--background-alt)', color: 'var(--primary)' }}
                >
                  Jetzt ausprobieren
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}