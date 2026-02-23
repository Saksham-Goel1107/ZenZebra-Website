import arcjet, { detectBot, fixedWindow, shield, slidingWindow, validateEmail } from '@arcjet/next';

// Register any custom rules or configurations here
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

// Dedicated rate limiter for sensitive API routes (e.g. login, contact)
export const apiRateLimiter = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ['ip.src'],
  rules: [
    slidingWindow({
      mode: 'LIVE',
      interval: '1m',
      max: 10,
    }),
  ],
});

// Sensitive form rate limiter (e.g. inquiries, partner requests)
// Includes email validation to prevent spam with fake emails
export const formRateLimiter = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ['ip.src'],
  rules: [
    fixedWindow({
      mode: 'LIVE',
      window: '1h',
      max: 5,
    }),
    validateEmail({
      mode: 'LIVE',
      deny: ['DISPOSABLE', 'INVALID', 'NO_MX_RECORDS'],
    }),
  ],
});
