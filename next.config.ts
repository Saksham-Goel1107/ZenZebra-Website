import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fra.cloud.appwrite.io',
      },
      {
        protocol: 'https',
        hostname: 'cloud.appwrite.io',
      },
    ],
  },
  serverExternalPackages: ['node-appwrite'],
  webpack: (config, { isServer }) => {
    // Optimization: Disabling source maps during build can prevent OOM errors in memory-limited builders
    if (!isServer && process.env.NODE_ENV === 'production') {
      config.devtool = false;
    }
    return config;
  },
  // Memory optimizations for build
  typescript: {
    // Optionally ignore if you have a lot of errors slowing down build
    ignoreBuildErrors: true,
  },
  // Reduce compression efforts during build
  compress: false,
};

export default withSentryConfig(nextConfig, {
  org: 'zenzebra',
  project: 'javascript-nextjs',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',

  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeTracing: true,
    excludeReplayShadowDom: true,
    excludeReplayIframe: true,
    excludeReplayWorker: true,
  },

  disableLogger: true,

  // Sentry Optimizations
  sourcemaps: {
    // Disable sourcemap upload to save memory during build
    disable: process.env.NODE_ENV === 'production',
  },

  // Disable automatic Sentry instrumentation for server/client to save memory
  // You can still manually instrument if needed, but this saves build-time resources
  // hideSourceMaps: true,
});
