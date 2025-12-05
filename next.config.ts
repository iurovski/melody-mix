import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Allow LAN/dev origins that hit the dev server (e.g., mobile on same Wi‑Fi)
  allowedDevOrigins: ["http://192.168.68.54:3000"],
};

export default nextConfig;
