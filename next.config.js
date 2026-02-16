const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', 'react-reconciler'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Force all packages (especially react-reconciler) to use the same
      // React instance as the app. Without this, Next.js 15's module
      // resolution gives react-reconciler a different copy of React,
      // causing "Cannot read properties of undefined (reading 'ReactCurrentOwner')".
      const reactDir = path.dirname(require.resolve('react/package.json'));
      const reactDomDir = path.dirname(require.resolve('react-dom/package.json'));
      config.resolve.alias = {
        ...config.resolve.alias,
        react$: path.join(reactDir, 'index.js'),
        'react/jsx-runtime$': path.join(reactDir, 'jsx-runtime.js'),
        'react/jsx-dev-runtime$': path.join(reactDir, 'jsx-dev-runtime.js'),
        'react-dom$': path.join(reactDomDir, 'index.js'),
        'react-dom/client$': path.join(reactDomDir, 'client.js'),
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig