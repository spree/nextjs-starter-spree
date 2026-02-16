"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-white text-center">
        <div>
          <h1 className="mb-4 text-2xl font-bold">Something went wrong</h1>
          <p className="mb-6 text-gray-600">
            An unexpected error occurred. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded bg-black px-6 py-2 text-white hover:bg-gray-800"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
