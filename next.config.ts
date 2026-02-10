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
};

export default withSentryConfig(nextConfig, {
  org: 'zenzebra',

  project: 'javascript-nextjs',

  silent: !process.env.CI,

  widenClientFileUpload: true,

  tunnelRoute: '/monitoring',

  webpack: {
    automaticVercelMonitors: true,

    treeshake: {
      removeDebugLogging: true,
    },
  },
});
