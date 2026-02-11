/**
 * Secure logging utility for production environments
 * Only logs in development mode to prevent sensitive data leakage
 */

export const secureLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

export const secureError = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(...args);
  } else {
    // In production, log to error monitoring service (e.g., Sentry)
    console.error('[ERROR]', new Date().toISOString());
  }
};

export const secureWarn = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(...args);
  }
};
