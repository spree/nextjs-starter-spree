import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: {
    isAuthenticated: false,
    loading: true,
  },
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mocks.auth,
}));
vi.mock("@/components/account/AccountShell", () => ({
  AccountShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="account-shell">{children}</div>
  ),
}));

import { AuthenticatedAccountShell } from "../AuthenticatedAccountShell";

describe("AuthenticatedAccountShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.isAuthenticated = false;
    mocks.auth.loading = true;
  });

  it("does not reveal account chrome while the session is loading", () => {
    render(
      <AuthenticatedAccountShell loginHref="/us/en/account">
        Protected account content
      </AuthenticatedAccountShell>,
    );

    expect(screen.queryByTestId("account-shell")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Protected account content"),
    ).not.toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("redirects a rejected session without revealing account chrome", async () => {
    mocks.auth.loading = false;

    render(
      <AuthenticatedAccountShell loginHref="/us/en/account?redirect=%2Fus%2Fen%2Faccount%2Forders">
        Protected account content
      </AuthenticatedAccountShell>,
    );

    expect(screen.queryByTestId("account-shell")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith(
        "/us/en/account?redirect=%2Fus%2Fen%2Faccount%2Forders",
      );
    });
  });

  it("renders account chrome only after authentication succeeds", () => {
    mocks.auth.loading = false;
    mocks.auth.isAuthenticated = true;

    render(
      <AuthenticatedAccountShell loginHref="/us/en/account">
        Protected account content
      </AuthenticatedAccountShell>,
    );

    expect(screen.getByTestId("account-shell")).toBeInTheDocument();
    expect(screen.getByText("Protected account content")).toBeInTheDocument();
  });
});
