import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // StrictMode disabled (dev-only) — REQUIRED for the r3f Lanyard on this machine:
  // StrictMode double-mounts the Canvas, leaving two live WebGL contexts; on the
  // AMD RX 6600M + ANGLE D3D11 stack the GPU process then dies ~1s later
  // (webglcontextlost → 3D card goes blank). Production static export is unaffected
  // (StrictMode double-invocation is dev-only).
  reactStrictMode: false,
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(',').map(s => s.trim()) ?? ['100.64.0.12', '192.168.1.5'],
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
  output: 'export',
};

export default nextConfig;
