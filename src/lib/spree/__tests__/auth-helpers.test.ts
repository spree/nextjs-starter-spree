import { beforeEach, describe, expect, it, vi } from "vitest";

// Outer state referenced inside vi.mock factories must be `mock`-prefixed so
// Vitest allows it past the hoisting guard.
const mockClient = { auth: { refresh: vi.fn() } };
const mockCookieState: { access?: string; refresh?: string } = {};
const mockCanPersist = vi.fn(async () => true);
const mockIsJwtExpired = vi.fn(() => true);
const mockClearAccessToken = vi.fn(async () => {
  mockCookieState.access = undefined;
});
const mockClearRefreshToken = vi.fn(async () => {
  mockCookieState.refresh = undefined;
});
const mockSetAccessToken = vi.fn(async (token: string) => {
  mockCookieState.access = token;
});
const mockSetRefreshToken = vi.fn(async (token: string) => {
  mockCookieState.refresh = token;
});

vi.mock("../config", () => ({ getClient: () => mockClient }));
vi.mock("../jwt", () => ({ isJwtExpired: () => mockIsJwtExpired() }));
vi.mock("../cookies", () => ({
  getAccessToken: async () => mockCookieState.access,
  getRefreshToken: async () => mockCookieState.refresh,
  canPersistCookies: () => mockCanPersist(),
  setAccessToken: (token: string) => mockSetAccessToken(token),
  setRefreshToken: (token: string) => mockSetRefreshToken(token),
  clearAccessToken: () => mockClearAccessToken(),
  clearRefreshToken: () => mockClearRefreshToken(),
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

import { ensureFreshSession } from "../auth-helpers";

describe("ensureFreshSession refresh resilience", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.auth.refresh.mockReset();
    mockCookieState.access = "expired-jwt";
    mockCookieState.refresh = "rt-1";
  });

  it("preserves the session when the refresh call fails transiently", async () => {
    mockClient.auth.refresh.mockRejectedValueOnce(new Error("network down"));

    const state = await ensureFreshSession();

    expect(state).toBe("stale");
    expect(mockClearAccessToken).not.toHaveBeenCalled();
    expect(mockClearRefreshToken).not.toHaveBeenCalled();
    expect(mockCookieState.refresh).toBe("rt-1");
  });

  it("drops the session when the refresh token is confirmed invalid", async () => {
    const { SpreeError } = await import("@spree/sdk");
    mockClient.auth.refresh.mockRejectedValueOnce(
      new SpreeError(
        { error: { code: "invalid_refresh_token", message: "Invalid" } },
        401,
      ),
    );

    const state = await ensureFreshSession();

    expect(state).toBe("expired");
    expect(mockClearAccessToken).toHaveBeenCalled();
    expect(mockClearRefreshToken).toHaveBeenCalled();
  });

  it("coalesces concurrent refreshes sharing a token into a single call", async () => {
    mockClient.auth.refresh.mockImplementation(async () => {
      // Yield once so both callers reach the in-flight map before resolving.
      await Promise.resolve();
      return { token: "new-jwt", refresh_token: "rt-2" };
    });

    const [first, second] = await Promise.all([
      ensureFreshSession(),
      ensureFreshSession(),
    ]);

    expect(first).toBe("refreshed");
    expect(second).toBe("refreshed");
    expect(mockClient.auth.refresh).toHaveBeenCalledTimes(1);
  });
});
