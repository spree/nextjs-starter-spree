/**
 * Client-side cache for completed order data using sessionStorage.
 *
 * When `POST /carts/:id/complete` returns the order, we store it here
 * so the thank-you page can display it immediately without re-fetching.
 * Falls back to API on page refresh.
 *
 * Future-proof: in Spree 6, `complete` will return a new Order object
 * with its own ID. This cache works regardless — it stores whatever
 * the completion response returns, keyed by the cart ID used to complete.
 */

const STORAGE_KEY_PREFIX = "spree_completed_order_";

export function cacheCompletedOrder(cartId: string, order: unknown): void {
  try {
    sessionStorage.setItem(
      `${STORAGE_KEY_PREFIX}${cartId}`,
      JSON.stringify(order),
    );
  } catch {
    // sessionStorage unavailable (SSR, private browsing quota) — ignore
  }
}

export function getCachedCompletedOrder(cartId: string): unknown | null {
  try {
    const data = sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${cartId}`);
    if (!data) return null;

    // Remove after reading — one-time use
    sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${cartId}`);
    return JSON.parse(data);
  } catch {
    return null;
  }
}
