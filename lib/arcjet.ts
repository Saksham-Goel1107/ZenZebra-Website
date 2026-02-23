import arcjet, { detectBot, shield } from '@arcjet/next';

// Main Arcjet instance for middleware protection
export const aj = arcjet({
  key: process.env.ARCJET_KEY!, // Get your site key from https://app.arcjet.com
  characteristics: ['ip.src'], // Track requests by IP address
  rules: [
    // Shield protects your app from common attacks e.g. SQL injection, XSS, etc.
    shield({
      mode: 'LIVE', // or "DRY_RUN"
    }),
    // Create a bot detection rule
    detectBot({
      mode: 'LIVE', // or "DRY_RUN"
      // Block all bots except search engines/social media crawlers
      allow: [
        'CATEGORY:SEARCH_ENGINE',
        'CATEGORY:MONITOR', // Allow uptime monitors
      ],
    }),
  ],
});
