import * as Sentry from "@sentry/node";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,

  // Add Tracing by setting tracesSampleRate
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Alternatively, to control sampling dynamically
  // tracesSampler: samplingContext => { /* ... */ }
}); 