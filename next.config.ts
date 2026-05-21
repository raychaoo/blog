import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['100.64.0.12'],
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
