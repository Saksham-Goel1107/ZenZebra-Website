import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://ecababcb4292a727509246ecb552979a@o4510832490446848.ingest.us.sentry.io/4510832491495424",

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  enableLogs: process.env.NODE_ENV !== 'production',
  sendDefaultPii: false,
});
