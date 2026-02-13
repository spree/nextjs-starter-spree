import * as Sentry from "@sentry/nextjs";

export async function register() {
  const dsn = process.env.SENTRY_DSN;

  // Opt-in to sending PII (IP addresses, cookies, user data) to Sentry.
  // Defaults to false for privacy. Set SENTRY_SEND_DEFAULT_PII=true to enable.
  const sendDefaultPii =
    process.env.SENTRY_SEND_DEFAULT_PII === "true";

  if (dsn) {
    Sentry.init({
      dsn,
      sendDefaultPii,
      tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
