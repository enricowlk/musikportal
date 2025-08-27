import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Aktiviert Standalone Output für Docker
  output: "standalone",
  
  // Konfiguration für File Uploads - Updated für Next.js 15
  serverExternalPackages: ['music-metadata', 'node-id3', 'formidable'],
  
  // Optimierungen für Production
  poweredByHeader: false,
  
  // Image Konfiguration
  images: {
    unoptimized: true
  }
};

export default nextConfig;
