"use server";

import {
  clearAccessToken,
  clearCartCookies,
  clearRefreshToken,
  getAccessToken,
  getCartId,
  getCartToken,
  getClient,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  withAuthRefresh,
} from "@spree/next";
import type { Customer } from "@spree/sdk";
import { updateTag } from "next/cache";
import { actionResult } from "./utils";

/**
 * Get the currently authenticated customer. Returns null if not logged in.
 */
export async function getCustomer(): Promise<Customer | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    return await withAuthRefresh(async (options) => {
      return getClient().customer.get(options);
    });
  } catch {
    await clearAccessToken();
    await clearRefreshToken();
    return null;
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
    await setAccessToken(result.token);
    await setRefreshToken(result.refresh_token);

    // Associate guest cart if one exists
    const cartToken = await getCartToken();
    const cartId = await getCartId();
    if (cartToken && cartId) {
      try {
        await getClient().carts.associate(cartId, {
          token: result.token,
          spreeToken: cartToken,
        });
      } catch {
        // Cart association failure is non-fatal
      }
    }

    updateTag("customer");
    updateTag("cart");
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
    await setAccessToken(result.token);
    await setRefreshToken(result.refresh_token);

    // Associate guest cart
    const cartToken = await getCartToken();
    const cartId = await getCartId();
    if (cartToken && cartId) {
      try {
        await getClient().carts.associate(cartId, {
          token: result.token,
          spreeToken: cartToken,
        });
      } catch {
        // Non-fatal
      }
    }

    updateTag("customer");
    updateTag("cart");
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
  await clearCartCookies();
  updateTag("customer");
  updateTag("cart");
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
    await setAccessToken(result.token);
    await setRefreshToken(result.refresh_token);
    updateTag("customer");
    updateTag("cart");
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
}) {
  return actionResult(async () => {
    const customer = await withAuthRefresh(async (options) => {
      return getClient().customer.update(data, options);
    });
    updateTag("customer");
    return { customer };
  }, "Update failed");
}
