import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@spree/next", () => ({
  getCustomer: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  updateCustomer: vi.fn(),
}));

import {
  getCustomer as getCustomerSdk,
  login as loginSdk,
  logout as logoutSdk,
  register as registerSdk,
  updateCustomer as updateCustomerSdk,
} from "@spree/next";

import {
  getCustomer,
  login,
  logout,
  register,
  updateCustomer,
} from "@/lib/data/customer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test fixtures are intentionally partial
const mockGetCustomer = getCustomerSdk as any;
const mockLogin = loginSdk as any;
const mockRegister = registerSdk as any;
const mockLogout = logoutSdk as any;
const mockUpdateCustomer = updateCustomerSdk as any;

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
    it("delegates to @spree/next", async () => {
      mockGetCustomer.mockResolvedValue(mockUser);

      const result = await getCustomer();

      expect(mockGetCustomer).toHaveBeenCalledOnce();
      expect(result).toBe(mockUser);
    });
  });

  describe("login", () => {
    it("delegates with email and password", async () => {
      mockLogin.mockResolvedValue(mockUser);

      const result = await login("test@example.com", "password123");

      expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
      expect(result).toBe(mockUser);
    });
  });

  describe("register", () => {
    it("delegates with email, password, and confirmation", async () => {
      mockRegister.mockResolvedValue(mockUser);

      const result = await register("test@example.com", "pass", "pass");

      expect(mockRegister).toHaveBeenCalledWith(
        "test@example.com",
        "pass",
        "pass",
      );
      expect(result).toBe(mockUser);
    });
  });

  describe("logout", () => {
    it("delegates to @spree/next", async () => {
      mockLogout.mockResolvedValue(undefined);

      await logout();

      expect(mockLogout).toHaveBeenCalledOnce();
    });
  });

  describe("updateCustomer", () => {
    it("returns success with customer", async () => {
      mockUpdateCustomer.mockResolvedValue(mockUser);

      const result = await updateCustomer({ first_name: "Updated" });

      expect(mockUpdateCustomer).toHaveBeenCalledWith({
        first_name: "Updated",
      });
      expect(result).toEqual({ success: true, customer: mockUser });
    });

    it("returns error on failure", async () => {
      mockUpdateCustomer.mockRejectedValue(new Error("Email taken"));

      const result = await updateCustomer({ email: "taken@example.com" });

      expect(result).toEqual({
        success: false,
        error: "Email taken",
      });
    });

    it("returns fallback message for non-Error throws", async () => {
      mockUpdateCustomer.mockRejectedValue("unexpected");

      const result = await updateCustomer({ first_name: "Test" });

      expect(result).toEqual({
        success: false,
        error: "Update failed",
      });
    });
  });
});
