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

vi.mock("@spree/next", () => ({
  getClient: () => mockClient,
  withAuthRefresh: vi.fn(
    async (fn: (options: { token: string }) => Promise<unknown>) => {
      return fn({ token: "jwt-token" });
    },
  ),
  getAccessToken: vi.fn().mockResolvedValue("jwt-token"),
  setAccessToken: vi.fn(),
  clearAccessToken: vi.fn(),
  getRefreshToken: vi.fn().mockResolvedValue(undefined),
  setRefreshToken: vi.fn(),
  clearRefreshToken: vi.fn(),
  getCartToken: vi.fn().mockResolvedValue(undefined),
  getCartId: vi.fn().mockResolvedValue(undefined),
  clearCartCookies: vi.fn(),
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
      const { withAuthRefresh } = await import("@spree/next");
      (withAuthRefresh as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new SpreeError(
          { error: { code: "unauthorized", message: "Unauthorized" } },
          401,
        ),
      );

      const result = await getCustomer();

      expect(result).toBeNull();
      const { clearAccessToken, clearRefreshToken } = await import(
        "@spree/next"
      );
      expect(clearAccessToken).toHaveBeenCalled();
      expect(clearRefreshToken).toHaveBeenCalled();
    });

    it("does not clear tokens on transient errors", async () => {
      const { withAuthRefresh } = await import("@spree/next");
      (withAuthRefresh as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error("Network error"),
      );

      const result = await getCustomer();

      expect(result).toBeNull();
      const { clearAccessToken, clearRefreshToken } = await import(
        "@spree/next"
      );
      expect(clearAccessToken).not.toHaveBeenCalled();
      expect(clearRefreshToken).not.toHaveBeenCalled();
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

      const { clearAccessToken, clearRefreshToken, clearCartCookies } =
        await import("@spree/next");
      expect(clearAccessToken).toHaveBeenCalled();
      expect(clearRefreshToken).toHaveBeenCalled();
      expect(clearCartCookies).toHaveBeenCalled();
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

    it("returns error on failure", async () => {
      mockClient.customer.update.mockRejectedValue(new Error("Email taken"));

      const result = await updateCustomer({ email: "taken@example.com" });

      expect(result).toEqual({
        success: false,
        error: "Email taken",
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
