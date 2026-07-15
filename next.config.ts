import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Low-RAM machines: webpack pack cache can spike memory and crash `next dev`.
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
