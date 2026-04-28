import { act, render, screen, waitFor } from "@testing-library/react";
import { Suspense } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next-intl", async () => {
  const actual = await vi.importActual("next-intl");
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/us/en/confirm-payment/cart-1",
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/lib/data/payment", () => ({
  confirmPaymentAndCompleteCart: vi.fn(),
}));

vi.mock("@/lib/utils/path", () => ({
  extractBasePath: (path: string) => {
    const match = path.match(/^\/[^/]+\/[^/]+/);
    return match ? match[0] : "";
  },
}));

import { confirmPaymentAndCompleteCart } from "@/lib/data/payment";
import ConfirmPaymentPage from "../[id]/page";

const mockConfirm = vi.mocked(confirmPaymentAndCompleteCart);

function renderPage(params = { id: "cart-1", country: "us", locale: "en" }) {
  const resolvedParams = Promise.resolve(params);
  return render(
    <Suspense fallback={<div>suspense-fallback</div>}>
      <ConfirmPaymentPage params={resolvedParams} />
    </Suspense>,
  );
}

describe("ConfirmPaymentPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it("shows loading spinner", async () => {
    mockConfirm.mockReturnValue(new Promise(() => {})); // never resolves

    await act(async () => {
      renderPage();
    });

    expect(screen.getByText("confirmingPayment")).toBeInTheDocument();
  });

  it("redirects to order-placed on success", async () => {
    mockSearchParams.set("session", "session-1");
    mockConfirm.mockResolvedValue({
      success: true as const,
      order: { id: "cart-1" },
    });

    await act(async () => {
      renderPage();
    });

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledWith(
        "cart-1",
        "session-1",
        undefined,
        undefined,
        undefined,
      );
      expect(mockReplace).toHaveBeenCalledWith("/us/en/order-placed/cart-1");
    });
  });

  it("passes sessionResult query param to confirmPaymentAndCompleteCart", async () => {
    mockSearchParams.set("session", "session-1");
    mockSearchParams.set("sessionResult", "eyJhYmMiOiJ4eXoifQ==");
    mockConfirm.mockResolvedValue({
      success: true as const,
      order: { id: "cart-1" },
    });

    await act(async () => {
      renderPage();
    });

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledWith(
        "cart-1",
        "session-1",
        "eyJhYmMiOiJ4eXoifQ==",
        undefined,
        undefined,
      );
    });
  });

  it("redirects to checkout with error on failure", async () => {
    mockSearchParams.set("session", "session-1");
    mockConfirm.mockResolvedValue({
      success: false as const,
      error: "Payment declined",
    });

    await act(async () => {
      renderPage();
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        "/us/en/checkout/cart-1?payment_error=Payment%20declined",
      );
    });
  });

  it("passes undefined session when no query param", async () => {
    mockConfirm.mockResolvedValue({
      success: true as const,
      order: { id: "cart-1" },
    });

    await act(async () => {
      renderPage();
    });

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledWith(
        "cart-1",
        undefined,
        undefined,
        undefined,
        undefined,
      );
      expect(mockReplace).toHaveBeenCalledWith("/us/en/order-placed/cart-1");
    });
  });

  it("uses fallback error message when none provided", async () => {
    mockSearchParams.set("session", "session-1");
    mockConfirm.mockResolvedValue({
      success: false as const,
      error: "",
    });

    await act(async () => {
      renderPage();
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        expect.stringContaining(
          "/us/en/checkout/cart-1?payment_error=paymentError",
        ),
      );
    });
  });

  it("only calls confirm once (idempotent)", async () => {
    mockSearchParams.set("session", "session-1");
    mockConfirm.mockResolvedValue({
      success: true as const,
      order: { id: "cart-1" },
    });

    let result: ReturnType<typeof renderPage>;
    await act(async () => {
      result = renderPage();
    });

    // Re-render to simulate React strict mode double-effect
    await act(async () => {
      result!.rerender(
        <Suspense fallback={<div>suspense-fallback</div>}>
          <ConfirmPaymentPage
            params={Promise.resolve({
              id: "cart-1",
              country: "us",
              locale: "en",
            })}
          />
        </Suspense>,
      );
    });

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledTimes(1);
    });
  });
});
