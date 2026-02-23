import arcjet, { fixedWindow, slidingWindow, validateEmail } from '@arcjet/next';

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
