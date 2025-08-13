"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const token = (e.currentTarget as HTMLFormElement).token.value;

  if (token === process.env.NEXT_PUBLIC_STATIC_ACCESS_TOKEN) {
    // Cookie über API-Route setzen
    const res = await fetch('/api/set-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (res.ok) {
      router.push("/dashboard");
    }
  } else {
    alert("Falscher Token!");
  }
}

  return (
<div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)', color: 'var(--foreground)' }} suppressHydrationWarning>
  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 z-10">
    <form onSubmit={handleSubmit} className="p-8 rounded shadow dark:shadow-black" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <h1 className="text-2xl mb-4" style={{ color: 'var(--foreground)' }}>Musikportal Zugang</h1>
      <input
        name="token"
        type="password"
        placeholder="Token eingeben"
        className="border dark:border-gray-600 p-2 w-full mb-4"
        required
        style={{ color: 'var(--foreground)' }}
      />
      <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white p-2 w-full rounded">
        Zugang erhalten
      </button>
    </form>
</main>
</div>
  );
}