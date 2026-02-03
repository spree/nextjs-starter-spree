"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

interface CheckoutContextValue {
  summaryContent: ReactNode;
  setSummaryContent: (content: ReactNode) => void;
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [summaryContent, setSummaryContent] = useState<ReactNode>(null);

  return (
    <CheckoutContext.Provider value={{ summaryContent, setSummaryContent }}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error("useCheckout must be used within a CheckoutProvider");
  }
  return context;
}

export function CheckoutSummary() {
  const { summaryContent } = useCheckout();
  return <>{summaryContent}</>;
}
