import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { REQUEST_PATHNAME_HEADER, REQUEST_SEARCH_HEADER } from "@/i18n/routing";

const mocks = vi.hoisted(() => ({
  accessToken: undefined as string | undefined,
  refreshToken: undefined as string | undefined,
  headers: vi.fn(),
  redirect: vi.fn((location: string) => {
    throw new Error(`redirect:${location}`);
  }),
}));

vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/spree", () => ({
  getAccessToken: () => Promise.resolve(mocks.accessToken),
  getRefreshToken: () => Promise.resolve(mocks.refreshToken),
}));
vi.mock("@/components/account/AuthenticatedAccountShell", () => ({
  AuthenticatedAccountShell: ({
    children,
    loginHref,
  }: {
    children: React.ReactNode;
    loginHref: string;
  }) => (
    <div data-testid="account-shell" data-login-href={loginHref}>
      {children}
    </div>
  ),
}));

import { AuthenticatedAccountLayoutContent } from "./layout";

function renderLayout() {
  return AuthenticatedAccountLayoutContent({
    children: <div>Protected account content</div>,
    params: Promise.resolve({ country: "us", locale: "en" }),
  });
}

describe("AuthenticatedAccountLayoutContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.accessToken = undefined;
    mocks.refreshToken = undefined;
    mocks.headers.mockResolvedValue(
      new Headers({
        [REQUEST_PATHNAME_HEADER]: "/us/en/account/orders",
        [REQUEST_SEARCH_HEADER]: "?state=complete",
      }),
    );
  });

  it("redirects an anonymous request before rendering protected chrome", async () => {
    await expect(renderLayout()).rejects.toThrow(
      "redirect:/us/en/account?redirect=%2Fus%2Fen%2Faccount%2Forders%3Fstate%3Dcomplete",
    );
    expect(mocks.redirect).toHaveBeenCalledOnce();
  });

  it("renders the protected route when an access token is present", async () => {
    mocks.accessToken = "access-token";

    render(await renderLayout());

    expect(screen.getByText("Protected account content")).toBeInTheDocument();
    expect(screen.getByTestId("account-shell")).toHaveAttribute(
      "data-login-href",
      "/us/en/account?redirect=%2Fus%2Fen%2Faccount%2Forders%3Fstate%3Dcomplete",
    );
  });

  it("allows a refresh-only session to recover before client verification", async () => {
    mocks.refreshToken = "refresh-token";

    render(await renderLayout());

    expect(screen.getByText("Protected account content")).toBeInTheDocument();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
