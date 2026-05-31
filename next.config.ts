import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(',').map(s => s.trim()) ?? ['100.64.0.12', '192.168.1.11'],
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
  output: 'export',
};

export default nextConfig;
