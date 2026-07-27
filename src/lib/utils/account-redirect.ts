const INTERNAL_ORIGIN = "https://storefront.invalid";
const ENCODED_PATH_SEPARATOR = /%(?:2f|5c)/i;

function isAllowedLocalizedDestination(
  pathname: string,
  basePath: string,
): boolean {
  const accountPath = `${basePath}/account`;
  const checkoutPath = `${basePath}/checkout`;

  return (
    pathname === accountPath ||
    pathname.startsWith(`${accountPath}/`) ||
    pathname === checkoutPath ||
    pathname.startsWith(`${checkoutPath}/`)
  );
}

/**
 * Resolve a login return target without allowing cross-origin or cross-market
 * navigation. Account and checkout are the only flows that send users through
 * the account sign-in page today.
 */
export function resolveAccountRedirect(
  redirect: string | null | undefined,
  basePath: string,
): string | null {
  if (
    !redirect?.startsWith("/") ||
    redirect.startsWith("//") ||
    redirect.includes("\\") ||
    ENCODED_PATH_SEPARATOR.test(redirect)
  ) {
    return null;
  }

  try {
    const target = new URL(redirect, INTERNAL_ORIGIN);
    if (
      target.origin !== INTERNAL_ORIGIN ||
      !isAllowedLocalizedDestination(target.pathname, basePath)
    ) {
      return null;
    }

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return null;
  }
}

export function buildAccountLoginHref(
  basePath: string,
  returnTo?: string | null,
): string {
  const accountPath = `${basePath}/account`;
  const safeReturnTo = resolveAccountRedirect(returnTo, basePath);

  if (!safeReturnTo || safeReturnTo === accountPath) return accountPath;

  return `${accountPath}?redirect=${encodeURIComponent(safeReturnTo)}`;
}

/**
 * Move a validated localized account/checkout target to a new market prefix.
 * The page suffix, query string, and hash belong to the target and must stay
 * intact when the storefront country or locale changes.
 */
export function rebaseAccountRedirect(
  redirect: string | null | undefined,
  currentBasePath: string,
  nextBasePath: string,
): string | null {
  const safeRedirect = resolveAccountRedirect(redirect, currentBasePath);
  if (!safeRedirect) return null;

  const target = new URL(safeRedirect, INTERNAL_ORIGIN);
  const currentPrefix = `${currentBasePath}/`;
  const nextPath =
    target.pathname === currentBasePath
      ? nextBasePath
      : target.pathname.startsWith(currentPrefix)
        ? `${nextBasePath}${target.pathname.slice(currentBasePath.length)}`
        : null;

  if (!nextPath) return null;

  return resolveAccountRedirect(
    `${nextPath}${target.search}${target.hash}`,
    nextBasePath,
  );
}

/**
 * Rebase a login return target inside a URL search string. Invalid redirect
 * values are discarded instead of being carried into another market.
 */
export function rebaseAccountRedirectSearch(
  search: string,
  currentBasePath: string,
  nextBasePath: string,
): string {
  const params = new URLSearchParams(search);
  const redirect = params.get("redirect");
  if (redirect === null) return search;

  const rebasedRedirect = rebaseAccountRedirect(
    redirect,
    currentBasePath,
    nextBasePath,
  );
  if (rebasedRedirect) {
    params.set("redirect", rebasedRedirect);
  } else {
    params.delete("redirect");
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}
