import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keeps the first Vercel deploy simple (no ESLint setup needed).
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
