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
    <main className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
  <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded shadow dark:shadow-gray-700">
    <h1 className="text-2xl mb-4 dark:text-white">Musikportal Zugang</h1>
    <input
      name="token"
      type="password"
      placeholder="Token eingeben"
      className="border dark:border-gray-600 p-2 w-full mb-4 dark:bg-gray-700 dark:text-white"
      required
    />
    <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white p-2 w-full rounded">
      Zugang erhalten
    </button>
  </form>
</main>
  );
}