"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

const PENDING = Symbol("pending");

interface CheckoutContextValue {
  summaryContent: ReactNode | typeof PENDING;
  setSummaryContent: (content: ReactNode) => void;
}

const CheckoutContext = createContext<CheckoutContextValue | undefined>(
  undefined,
);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [summaryContent, setSummaryContent] = useState<
    ReactNode | typeof PENDING
  >(PENDING);

  const value = useMemo<CheckoutContextValue>(
    () => ({ summaryContent, setSummaryContent }),
    [summaryContent],
  );

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error("useCheckout must be used within a CheckoutProvider");
  }
  return context;
}

function CheckoutSummarySkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gray-200 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-16" />
      </div>
      <div className="border-t border-gray-200 pt-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-12" />
        </div>
        <div className="flex justify-between pt-3 border-t border-gray-200">
          <div className="h-5 bg-gray-200 rounded w-14" />
          <div className="h-6 bg-gray-200 rounded w-24" />
        </div>
      </div>
    </div>
  );
}

export function CheckoutSummary() {
  const { summaryContent } = useCheckout();
  if (summaryContent === PENDING) return <CheckoutSummarySkeleton />;
  return <>{summaryContent}</>;
}
