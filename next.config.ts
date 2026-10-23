import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone',
  // PDFKit reads font data from disk at runtime, so keep it out of the bundle and
  // make sure the TTFs the PDF export embeds are copied into the standalone output.
  serverExternalPackages: ['pdfkit'],
  outputFileTracingIncludes: { '/admin/[id]/pdf': ['./assets/fonts/*.ttf'] },
  experimental: {
    // Photo uploads go through a route handler; allow a generous body.
    serverActions: { bodySizeLimit: '12mb' },
  },
};

export default config;
