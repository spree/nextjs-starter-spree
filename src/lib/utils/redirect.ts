/**
 * Return `target` only if it is a safe in-app path; otherwise return `fallback`.
 *
 * Guards against open-redirect attacks when a redirect target comes from user
 * input (e.g. `?redirect=...` on the login page). Accepted inputs are paths
 * that start with a single `/`. Rejected:
 *   - `null` / `undefined` / empty string
 *   - Absolute URLs (`http://`, `https://`, `javascript:`, `data:`, etc.)
 *   - Protocol-relative URLs (`//evil.com/...`, `/\evil.com`)
 *
 * The function does not attempt to constrain the target to a specific
 * `basePath`; locale/country prefixes are already part of in-app paths and
 * should be allowed.
 */
export function safeRedirect(
  target: string | null | undefined,
  fallback: string,
): string {
  if (!target || typeof target !== "string") return fallback;
  if (!target.startsWith("/")) return fallback;
  // Protocol-relative or backslash-prefixed — browsers may resolve these as external
  if (target.startsWith("//") || target.startsWith("/\\")) return fallback;
  return target;
}
