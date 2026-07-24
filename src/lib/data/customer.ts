"use server";

import type { Customer } from "@spree/sdk";
import { updateTag } from "next/cache";
import {
  cacheTagSuffix,
  clearAccessToken,
  clearAllCartCookies,
  clearAuthCookies,
  clearCartCookies,
  clearRefreshToken,
  ensureFreshSession,
  getAccessToken,
  getCartId,
  getCartToken,
  getClient,
  getRefreshToken,
  isAuthError,
  SURFACES,
  setAccessToken,
  setRefreshToken,
  withAuthRefresh,
} from "@/lib/spree";
import { actionResult } from "./utils";

/**
 * Fetch the current customer with automatic token refresh. Throws on any
 * failure (auth or transient) so callers can distinguish the two.
 */
async function fetchCustomer(): Promise<Customer> {
  return withAuthRefresh((options) => getClient().customer.get(options));
}

/**
 * Post-auth bootstrap: store tokens, associate guest cart, invalidate caches.
 * Shared by login, register, and resetPassword.
 */
async function finalizeAuth(token: string, refreshToken: string) {
  await setAccessToken(token);
  await setRefreshToken(refreshToken);

  // Associate guest cart if one exists
  const cartToken = await getCartToken();
  const cartId = await getCartId();
  if (cartToken && cartId) {
    try {
      await getClient().carts.associate(cartId, {
        token,
        spreeToken: cartToken,
      });
    } catch {
      // Cart belongs to another user or is invalid — clear stale cookies
      await clearCartCookies();
    }
  }

  updateTag("customer");
  updateTag("cart");
}

/**
 * Get the currently authenticated customer. Returns null if not logged in.
 */
export async function getCustomer(): Promise<Customer | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    return await fetchCustomer();
  } catch (error) {
    // Only clear tokens on confirmed auth failures — transient errors (network,
    // 5xx) must not log users out.
    if (isAuthError(error)) {
      await clearAuthCookies();
    }
    return null;
  }
}

/**
 * Reconcile the customer session on the client: refresh an expired JWT when
 * possible, then return the current customer. `refreshed` is true when a
 * transparent token refresh occurred, signalling the client to re-render
 * server components so their data reflects the renewed session. `stale` is true
 * when the customer fetch failed transiently — the caller should keep its
 * current session rather than treat it as logged out.
 */
export async function syncSession(): Promise<{
  customer: Customer | null;
  refreshed: boolean;
  stale?: boolean;
}> {
  const state = await ensureFreshSession();
  if (state === "anonymous" || state === "expired") {
    return { customer: null, refreshed: false };
  }
  if (state === "stale") {
    // The expired JWT couldn't be refreshed due to a transient failure — keep
    // the current client session rather than logging out on a blip.
    return { customer: null, refreshed: false, stale: true };
  }

  try {
    const customer = await fetchCustomer();
    return { customer, refreshed: state === "refreshed" };
  } catch (error) {
    if (isAuthError(error)) {
      await clearAuthCookies();
      return { customer: null, refreshed: false };
    }
    // Transient failure — preserve the session. Still surface a rotation that
    // did occur so the client re-renders server components under the new token.
    return { customer: null, refreshed: state === "refreshed", stale: true };
  }
}

/**
 * Login with email and password.
 * Automatically associates any guest cart with the authenticated user.
 */
export async function login(
  email: string,
  password: string,
): Promise<{
  success: boolean;
  user?: {
    id: string;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
  };
  error?: string;
}> {
  try {
    const result = await getClient().auth.login({ email, password });
    await finalizeAuth(result.token, result.refresh_token);
    return { success: true, user: result.user };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Invalid email or password",
    };
  }
}

/**
 * Register a new customer account.
 * Automatically associates any guest cart with the new account.
 */
export async function register(params: {
  email: string;
  password: string;
  password_confirmation: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  /** Arbitrary key-value data stored on the customer (e.g. wholesale company). */
  metadata?: Record<string, unknown>;
}): Promise<{
  success: boolean;
  user?: {
    id: string;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
  };
  error?: string;
}> {
  try {
    const result = await getClient().customers.create(params);
    await finalizeAuth(result.token, result.refresh_token);
    return { success: true, user: result.user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Registration failed",
    };
  }
}

/**
 * Logout the current user.
 */
export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    try {
      await getClient().auth.logout({ refresh_token: refreshToken });
    } catch {
      // Non-fatal — token may already be expired/revoked
    }
  }

  await clearAccessToken();
  await clearRefreshToken();
  // Clear every surface's cart — the wholesale cart lives in its own cookie
  // pair and cache tag, so a DTC-only clear would leave it behind for the
  // next session.
  await clearAllCartCookies();
  updateTag("customer");
  // Invalidate both the cart and the checkout (address/delivery) caches for
  // every surface — checkout state is tagged separately, so a cart-only clear
  // would leave the previous buyer's checkout data cached after logout.
  for (const surface of SURFACES) {
    updateTag(`cart${cacheTagSuffix(surface)}`);
    updateTag(`checkout${cacheTagSuffix(surface)}`);
  }
  updateTag("addresses");
  updateTag("credit-cards");
}

export async function requestPasswordReset(
  email: string,
  redirectUrl?: string,
) {
  return getClient().passwordResets.create({
    email,
    ...(redirectUrl && { redirect_url: redirectUrl }),
  });
}

/**
 * Reset password using a token from the password reset email.
 * On success, the user is automatically logged in and guest cart is associated.
 */
export async function resetPassword(
  token: string,
  password: string,
  passwordConfirmation: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await getClient().passwordResets.update(token, {
      password,
      password_confirmation: passwordConfirmation,
    });
    await finalizeAuth(result.token, result.refresh_token);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Password reset failed",
    };
  }
}

export async function updateCustomer(data: {
  first_name?: string;
  last_name?: string;
  email?: string;
  current_password?: string;
}) {
  return actionResult(async () => {
    let customer;
    try {
      customer = await withAuthRefresh(async (options) => {
        return getClient().customer.update(data, options);
      });
    } catch (error) {
      if (isAuthError(error)) {
        await clearAuthCookies();
      }
      throw error;
    }
    updateTag("customer");
    return { customer };
  }, "Update failed");
}
