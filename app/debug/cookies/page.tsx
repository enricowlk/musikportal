"use client";
import { useEffect, useState } from 'react';

interface CookieInfo {
  authToken: string | null;
  vereinInfo: string | null;
  debugAuth: string | null;
  allCookies: Record<string, string>;
  userAgent: string;
  timestamp: string;
}

export default function CookieDebug() {
  const [cookieInfo, setCookieInfo] = useState<CookieInfo | null>(null);
  const [localStorageInfo, setLocalStorageInfo] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCookieInfo = async () => {
      try {
        const response = await fetch('/api/debug/cookies');
        if (response.ok) {
          const data = await response.json();
          setCookieInfo(data);
        } else {
          setError(`HTTP Error: ${response.status}`);
        }
      } catch (err) {
        setError(`Network Error: ${err}`);
      }
    };

    // LocalStorage Info
    const localInfo: Record<string, string> = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          localInfo[key] = localStorage.getItem(key) || '';
        }
      }
    } catch (e) {
      localInfo['error'] = 'localStorage not accessible';
    }
    setLocalStorageInfo(localInfo);

    fetchCookieInfo();
  }, []);

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Cookie & Auth Debug</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Server-Side Cookies</h2>
          {error ? (
            <p className="text-red-600">Error: {error}</p>
          ) : cookieInfo ? (
            <pre className="text-sm overflow-auto">
              {JSON.stringify(cookieInfo, null, 2)}
            </pre>
          ) : (
            <p>Loading...</p>
          )}
        </div>

        <div className="bg-blue-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">LocalStorage</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(localStorageInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-green-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Browser Info</h2>
          <p><strong>User Agent:</strong> {navigator.userAgent}</p>
          <p><strong>Platform:</strong> {navigator.platform}</p>
          <p><strong>Cookies Enabled:</strong> {navigator.cookieEnabled ? 'Yes' : 'No'}</p>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>
          <button 
            onClick={() => {
              localStorage.clear();
              document.cookie.split(";").forEach(c => {
                const eqPos = c.indexOf("=");
                const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
              });
              window.location.reload();
            }}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
}
