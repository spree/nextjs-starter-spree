import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Opt-in to sending PII (IP addresses, cookies, user data) to Sentry.
// Defaults to false for privacy. Set NEXT_PUBLIC_SENTRY_SEND_DEFAULT_PII=true to enable.
const sendDefaultPii =
  process.env.NEXT_PUBLIC_SENTRY_SEND_DEFAULT_PII === "true";

if (dsn) {
  Sentry.init({
    dsn,
    sendDefaultPii,
    tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  });
}

export const onRouterTransitionStart = dsn
  ? Sentry.captureRouterTransitionStart
  : undefined;
