// Configuration

// Auth helpers (token refresh, cookie-based auth)
export {
  clearAuthCookies,
  ensureFreshSession,
  getAuthOptions,
  isAuthError,
  type SessionState,
  withAuthRefresh,
} from "./auth-helpers";
export { getClient, getConfig, initSpreeNext } from "./config";
// Cookie management
export {
  canPersistCookies,
  clearAccessToken,
  clearCartCookies,
  clearRefreshToken,
  getAccessToken,
  getCartId,
  getCartOptions,
  getCartToken,
  getRefreshToken,
  requireCartId,
  setAccessToken,
  setCartCookies,
  setRefreshToken,
} from "./cookies";
// JWT helpers (expiry inspection, no signature verification)
export { decodeJwtExp, isJwtExpired } from "./jwt";
// Locale resolution (reads country/locale from cookies)
export { getLocaleOptions } from "./locale";
export type { SpreeNextConfig, SpreeNextOptions } from "./types";
