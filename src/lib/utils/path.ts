/**
 * Extract the /country/locale base path prefix from a pathname.
 * e.g. "/us/en/products" -> "/us/en"
 */
export function extractBasePath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return "";
  return `/${segments[0]}/${segments[1]}`;
}

/**
 * Resolve a `?redirect=` value into a safe same-origin path, falling back when
 * it points anywhere else. Guards every post-login return target against open
 * redirects: a leading-slash check alone is not enough, because the URL parser
 * treats a backslash as a slash for http(s), so "/\evil.com" resolves to the
 * off-site "//evil.com". Repeated query keys arrive as an array — only the
 * first is considered.
 */
export function safeRedirectPath(
  value: string | string[] | undefined | null,
  fallback: string,
): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate?.startsWith("/")) return fallback;

  // Any value that resolves off this placeholder origin is not a local path.
  const origin = "https://redirect.invalid";
  try {
    const url = new URL(candidate, origin);
    if (url.origin !== origin) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

/**
 * Get the path portion after the /country/locale prefix.
 * e.g. "/us/en/products/shoes" -> "/products/shoes"
 */
export function getPathWithoutPrefix(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 2) return "";
  return `/${segments.slice(2).join("/")}`;
}
