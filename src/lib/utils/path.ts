/**
 * Extract the /country/locale base path prefix from a pathname.
 * e.g. "/us/en/products" -> "/us/en"
 */
export function extractBasePath(pathname: string): string {
  const match = pathname.match(/^\/([a-z]{2})\/([a-z]{2})(\/|$)/i);
  if (match) {
    return `/${match[1]}/${match[2]}`;
  }
  return "";
}

/**
 * Get the path portion after the /country/locale prefix.
 * e.g. "/us/en/products/shoes" -> "/products/shoes"
 */
export function getPathWithoutPrefix(pathname: string): string {
  const match = pathname.match(/^\/[a-z]{2}\/[a-z]{2}(\/.*)?$/i);
  return match?.[1] || "";
}
