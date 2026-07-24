import { beforeEach, describe, expect, it, vi } from "vitest";

const mockClient = {
  auth: {
    login: vi.fn(),
    logout: vi.fn(),
  },
  customers: {
    create: vi.fn(),
  },
  customer: {
    get: vi.fn(),
    update: vi.fn(),
  },
  carts: {
    associate: vi.fn(),
  },
};

vi.mock("@/lib/spree", () => ({
  getClient: () => mockClient,
  withAuthRefresh: vi.fn(
    async (fn: (options: { token: string }) => Promise<unknown>) => {
      return fn({ token: "jwt-token" });
    },
  ),
  ensureFreshSession: vi.fn().mockResolvedValue("valid"),
  isAuthError: (error: unknown) =>
    !!error &&
    typeof error === "object" &&
    "status" in error &&
    ((error as { status?: number }).status === 401 ||
      (error as { status?: number }).status === 403),
  getAccessToken: vi.fn().mockResolvedValue("jwt-token"),
  setAccessToken: vi.fn(),
  clearAccessToken: vi.fn(),
  clearAuthCookies: vi.fn(),
  getRefreshToken: vi.fn().mockResolvedValue(undefined),
  setRefreshToken: vi.fn(),
  clearRefreshToken: vi.fn(),
  getCartToken: vi.fn().mockResolvedValue(undefined),
  getCartId: vi.fn().mockResolvedValue(undefined),
  clearCartCookies: vi.fn(),
  clearAllCartCookies: vi.fn(),
  cacheTagSuffix: (surface: string) =>
    surface === "wholesale" ? "-wholesale" : "",
  SURFACES: ["dtc", "wholesale"] as const,
}));

vi.mock("@spree/sdk", () => ({
  SpreeError: class SpreeError extends Error {
    code: string;
    status: number;
    constructor(
      response: { error: { code: string; message: string } },
      status: number,
    ) {
      super(response.error.message);
      this.code = response.error.code;
      this.status = status;
    }
  },
}));

vi.mock("next/cache", () => ({
  updateTag: vi.fn(),
}));

import {
  getCustomer,
  login,
  logout,
  register,
  syncSession,
  updateCustomer,
} from "@/lib/data/customer";

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  first_name: "Test",
  last_name: "User",
};

describe("customer server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCustomer", () => {
    it("fetches current customer via SDK", async () => {
      mockClient.customer.get.mockResolvedValue(mockUser);

      const result = await getCustomer();

      expect(mockClient.customer.get).toHaveBeenCalledWith({
        token: "jwt-token",
      });
      expect(result).toBe(mockUser);
    });

    it("clears tokens on 401 auth failure", async () => {
      const { SpreeError } = await import("@spree/sdk");
      const { withAuthRefresh } = await import("@/lib/spree");
      (withAuthRefresh as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new SpreeError(
          { error: { code: "unauthorized", message: "Unauthorized" } },
          401,
        ),
      );

      const result = await getCustomer();

      expect(result).toBeNull();
      const { clearAuthCookies } = await import("@/lib/spree");
      expect(clearAuthCookies).toHaveBeenCalled();
    });

    it("does not clear tokens on transient errors", async () => {
      const { withAuthRefresh } = await import("@/lib/spree");
      (withAuthRefresh as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Network error"),
      );

      const result = await getCustomer();

      expect(result).toBeNull();
      const { clearAuthCookies } = await import("@/lib/spree");
      expect(clearAuthCookies).not.toHaveBeenCalled();
    });
  });

  describe("syncSession", () => {
    it("returns the customer without a refresh flag for a live session", async () => {
      const { ensureFreshSession } = await import("@/lib/spree");
      (ensureFreshSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        "valid",
      );
      mockClient.customer.get.mockResolvedValue(mockUser);

      const result = await syncSession();

      expect(result).toEqual({ customer: mockUser, refreshed: false });
    });

    it("flags a transparent refresh so the client can re-render", async () => {
      const { ensureFreshSession } = await import("@/lib/spree");
      (ensureFreshSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        "refreshed",
      );
      mockClient.customer.get.mockResolvedValue(mockUser);

      const result = await syncSession();

      expect(result).toEqual({ customer: mockUser, refreshed: true });
    });

    it("reports no customer for an expired session and skips the fetch", async () => {
      const { ensureFreshSession } = await import("@/lib/spree");
      (ensureFreshSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        "expired",
      );

      const result = await syncSession();

      expect(result).toEqual({ customer: null, refreshed: false });
      expect(mockClient.customer.get).not.toHaveBeenCalled();
    });

    it("reports no customer when anonymous", async () => {
      const { ensureFreshSession } = await import("@/lib/spree");
      (ensureFreshSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        "anonymous",
      );

      const result = await syncSession();

      expect(result).toEqual({ customer: null, refreshed: false });
      expect(mockClient.customer.get).not.toHaveBeenCalled();
    });

    it("marks the session stale on a transient fetch failure, preserving it", async () => {
      const { ensureFreshSession, clearAuthCookies } = await import(
        "@/lib/spree"
      );
      (ensureFreshSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        "valid",
      );
      mockClient.customer.get.mockRejectedValueOnce(new Error("Network error"));

      const result = await syncSession();

      expect(result).toEqual({
        customer: null,
        refreshed: false,
        stale: true,
      });
      // A transient failure must not clear the session.
      expect(clearAuthCookies).not.toHaveBeenCalled();
    });

    it("preserves the session without fetching when the refresh is transiently stale", async () => {
      const { ensureFreshSession, clearAuthCookies } = await import(
        "@/lib/spree"
      );
      (ensureFreshSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        "stale",
      );

      const result = await syncSession();

      expect(result).toEqual({
        customer: null,
        refreshed: false,
        stale: true,
      });
      expect(mockClient.customer.get).not.toHaveBeenCalled();
      expect(clearAuthCookies).not.toHaveBeenCalled();
    });

    it("keeps the refresh signal when a rotation is followed by a transient fetch failure", async () => {
      const { ensureFreshSession } = await import("@/lib/spree");
      (ensureFreshSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        "refreshed",
      );
      mockClient.customer.get.mockRejectedValueOnce(new Error("Network error"));

      const result = await syncSession();

      expect(result).toEqual({
        customer: null,
        refreshed: true,
        stale: true,
      });
    });

    it("logs out (no stale flag) when the fetch returns an auth error", async () => {
      const { SpreeError } = await import("@spree/sdk");
      const { ensureFreshSession, clearAuthCookies } = await import(
        "@/lib/spree"
      );
      (ensureFreshSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        "valid",
      );
      mockClient.customer.get.mockRejectedValueOnce(
        new SpreeError(
          { error: { code: "unauthorized", message: "Unauthorized" } },
          401,
        ),
      );

      const result = await syncSession();

      expect(result).toEqual({ customer: null, refreshed: false });
      expect(clearAuthCookies).toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("logs in and returns user", async () => {
      mockClient.auth.login.mockResolvedValue({
        token: "jwt",
        refresh_token: "rt",
        user: mockUser,
      });

      const result = await login("test@example.com", "password123");

      expect(mockClient.auth.login).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(result).toEqual({ success: true, user: mockUser });
    });
  });

  describe("register", () => {
    it("creates account and returns user", async () => {
      mockClient.customers.create.mockResolvedValue({
        token: "jwt",
        refresh_token: "rt",
        user: mockUser,
      });

      const result = await register({
        email: "test@example.com",
        password: "pass",
        password_confirmation: "pass",
        first_name: "Test",
        last_name: "User",
      });

      expect(mockClient.customers.create).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "pass",
        password_confirmation: "pass",
        first_name: "Test",
        last_name: "User",
      });
      expect(result).toEqual({ success: true, user: mockUser });
    });
  });

  describe("logout", () => {
    it("clears cookies", async () => {
      await logout();

      const { clearAccessToken, clearRefreshToken, clearAllCartCookies } =
        await import("@/lib/spree");
      expect(clearAccessToken).toHaveBeenCalled();
      expect(clearRefreshToken).toHaveBeenCalled();
      // Logout must clear every surface's cart, not just DTC.
      expect(clearAllCartCookies).toHaveBeenCalled();
    });

    it("invalidates cart and checkout caches for every surface", async () => {
      const { updateTag } = await import("next/cache");
      await logout();

      // Both surfaces, both tags — a cart-only clear would leave the previous
      // buyer's checkout (address/delivery) state cached after logout.
      expect(updateTag).toHaveBeenCalledWith("cart");
      expect(updateTag).toHaveBeenCalledWith("cart-wholesale");
      expect(updateTag).toHaveBeenCalledWith("checkout");
      expect(updateTag).toHaveBeenCalledWith("checkout-wholesale");
    });
  });

  describe("updateCustomer", () => {
    it("returns success with customer", async () => {
      mockClient.customer.update.mockResolvedValue(mockUser);

      const result = await updateCustomer({ first_name: "Updated" });

      expect(mockClient.customer.update).toHaveBeenCalledWith(
        { first_name: "Updated" },
        { token: "jwt-token" },
      );
      expect(result).toEqual({ success: true, customer: mockUser });
    });

    it("forwards current_password when changing email", async () => {
      mockClient.customer.update.mockResolvedValue(mockUser);

      const result = await updateCustomer({
        email: "new@example.com",
        current_password: "secret",
      });

      expect(mockClient.customer.update).toHaveBeenCalledWith(
        { email: "new@example.com", current_password: "secret" },
        { token: "jwt-token" },
      );
      expect(result).toEqual({ success: true, customer: mockUser });
    });

    it("returns error on failure", async () => {
      mockClient.customer.update.mockRejectedValue(new Error("Email taken"));

      const result = await updateCustomer({ email: "taken@example.com" });

      expect(result).toEqual({
        success: false,
        error: "Email taken",
      });
    });

    it("surfaces invalid current password error", async () => {
      mockClient.customer.update.mockRejectedValue(
        new Error("Current password is invalid or missing"),
      );

      const result = await updateCustomer({
        email: "new@example.com",
        current_password: "wrong",
      });

      expect(result).toEqual({
        success: false,
        error: "Current password is invalid or missing",
      });
    });

    it("returns fallback message for non-Error throws", async () => {
      mockClient.customer.update.mockRejectedValue("unexpected");

      const result = await updateCustomer({ first_name: "Test" });

      expect(result).toEqual({
        success: false,
        error: "Update failed",
      });
    });
  });
});
