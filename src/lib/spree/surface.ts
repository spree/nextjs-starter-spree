/**
 * A storefront surface is a distinct sales context backed by its own Spree
 * sales channel. The DTC surface is the public storefront; the wholesale
 * surface is the gated B2B portal.
 *
 * The surface selects three things that must never mix between contexts:
 *
 * - which SDK client (channel + publishable key) requests go through
 * - which cart cookies hold the surface's cart (a customer can have both an
 *   open DTC cart and an open wholesale cart at the same time)
 * - which cache tags/keys segment cached reads
 *
 * The customer session (JWT) is shared across surfaces — it's the same person
 * signing in — so only the cart cookies split, never the auth cookies.
 */
export type Surface = "dtc" | "wholesale";

export const DEFAULT_SURFACE: Surface = "dtc";

/** All storefront surfaces. Iterate this to act on every surface at once
 * (e.g. clearing all carts on logout). */
export const SURFACES: readonly Surface[] = ["dtc", "wholesale"];

/**
 * Cart cookie base name for a surface. The cart-id cookie is derived by
 * appending `_id` (see cookies.ts). Wholesale gets its own pair so the two
 * carts coexist.
 */
export function cartCookieBaseName(surface: Surface): string {
  return surface === "wholesale"
    ? "_spree_wholesale_cart_token"
    : "_spree_cart_token";
}

/**
 * Suffix appended to cache tags/keys so DTC and wholesale caches are disjoint.
 * DTC keeps the unsuffixed tags to preserve existing cache entries.
 */
export function cacheTagSuffix(surface: Surface): string {
  return surface === "wholesale" ? "-wholesale" : "";
}
