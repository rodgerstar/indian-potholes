// Polyfills must load before all other imports for older Safari/iOS
import './polyfills'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import * as Sentry from "@sentry/react";
import App from './App.jsx'
import './index.css'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  // Performance monitoring
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
  // Session tracking
  autoSessionTracking: true,
  // Environment
  environment: import.meta.env.MODE || 'development',
  // Release version
  release: import.meta.env.VITE_APP_VERSION || '1.0.0',
  // Enable debug mode in development
  debug: import.meta.env.MODE === 'development',
  // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/indianpotholes\.com\/api/],
  // Filter out browser extension errors
  beforeSend(event, hint) {
    const error = hint?.originalException || hint?.syntheticException;

    // Normalize name/message from both the error and the event payload
    const eventException = event?.exception?.values?.[0] || {};
    const name = (error && error.name) || eventException.type || '';
    const message = (error && error.message) || eventException.value || '';
    const code = (error && (error.code || error.status || error.number)) || null;

    // Filter out noisy, expected cancellations/aborts (e.g., user closes share sheet, route change cancels fetch)
    const isAbort = name === 'AbortError' || /AbortError/i.test(message) || /The operation was aborted/i.test(message) || code === 20;
    const isAxiosCanceled = (error && (error.code === 'ERR_CANCELED' || error.message === 'canceled' || error.name === 'CanceledError'));
    const isExtensionNoise = typeof message === 'string' && message.includes('Invalid call to runtime.sendMessage(). Tab not found.');
    const isUploadRoute = typeof window !== 'undefined' && window.location?.pathname === '/upload';
    const isTimeoutString = typeof message === 'string' && /^timeout(\s*\(.+\))?$/i.test(message.trim());

    // Ignore benign timeouts reported as bare strings on the upload page (e.g., captcha/script loader timeouts)
    if (isAbort || isAxiosCanceled || isExtensionNoise || (isUploadRoute && isTimeoutString)) {
      return null; // Drop benign/expected events
    }

    return event; // Send other events
  },
});

// Improve Sentry signal on string-based promise rejections and ignore AbortError/cancellations
window.addEventListener('unhandledrejection', (event) => {
  try {
    const reason = event?.reason;
    const name = reason?.name;
    const code = reason?.code ?? reason?.number;
    const msg = typeof reason === 'string' ? reason : reason?.message;
    const path = typeof window !== 'undefined' ? window.location?.pathname : '';

    // Ignore benign abort/cancel rejections (common on Safari/iOS when user cancels actions or navigates)
    if (
      name === 'AbortError' ||
      code === 20 ||
      /AbortError|The operation was aborted/i.test(msg || '') ||
      /ERR_CANCELED|canceled/i.test(msg || '')
    ) {
      event?.preventDefault?.();
      return;
    }

    // If the rejection reason is a bare string, handle selectively to reduce noise
    if (typeof reason === 'string') {
      const isTimeoutString = /^timeout(\s*\(.+\))?$/i.test(reason.trim());

      // Known benign: script/captcha loader timeouts on upload page
      if (isTimeoutString && path === '/upload') {
        event?.preventDefault?.();
        return; // ignore
      }

      // For other string reasons, capture with context and prevent duplicate SDK capture
      Sentry.captureException(new Error(reason), {
        tags: { rejection_type: 'string' },
        extra: { originalReason: reason },
      });
      event?.preventDefault?.();
    }

    // If the rejection reason is a plain object (e.g., { code, data, message }),
    // capture a normalized Error to avoid "Non-Error" noise while preserving context
    if (reason && typeof reason === 'object' && !(reason instanceof Error)) {
      const msg = typeof reason.message === 'string' ? reason.message : 'Promise rejected with non-Error object';
      Sentry.captureException(new Error(msg), {
        tags: { rejection_type: 'object' },
        extra: { originalReason: reason },
      });
      event?.preventDefault?.();
    }
  } catch (_) {
    // no-op
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<div>An error has occurred</div>}>
      <BrowserRouter>
        <App />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: '#fff',
              },
            },
          }}
        />
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
)
