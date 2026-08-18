import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone',
  experimental: {
    // Photo uploads go through a route handler; allow a generous body.
    serverActions: { bodySizeLimit: '12mb' },
  },
};

export default config;
