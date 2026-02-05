import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://ecababcb4292a727509246ecb552979a@o4510832490446848.ingest.us.sentry.io/4510832491495424",

  // Optimize bundle size by only including Replay in production if needed, 
  // or lazy loading it. For 100% performance score, we want minimal blocking JS.
  integrations: [
    Sentry.replayIntegration({
      // Additional config to make replay lighter
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Lower sampling rates for production to reduce main thread impact
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

  // Disable logs in production
  enableLogs: process.env.NODE_ENV !== 'production',

  // Session Replay is heavy. Reduce sampling significantly.
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  sendDefaultPii: false, // Disabling PII also helps reduce data payload size
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
