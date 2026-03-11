"use client";

import type { PaymentMethod } from "@spree/sdk";
import type { ReactNode } from "react";

interface PaymentMethodSelectorProps {
  paymentMethods: PaymentMethod[];
  selectedMethodId: string;
  onSelect: (methodId: string) => void;
  disabled?: boolean;
  /** Render gateway content inline below the selected method */
  renderContent?: (method: PaymentMethod) => ReactNode;
}

export function PaymentMethodSelector({
  paymentMethods,
  selectedMethodId,
  onSelect,
  disabled,
  renderContent,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      {paymentMethods.map((method) => {
        const isSelected = selectedMethodId === method.id;

        return (
          <div
            key={method.id}
            className={`rounded-xl border transition-colors ${
              isSelected
                ? "border-gray-600 bg-gray-50"
                : "border-gray-200 hover:border-gray-300"
            } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
          >
            <label className="flex items-center gap-3 p-4 cursor-pointer">
              <input
                type="radio"
                name="payment_method"
                checked={isSelected}
                onChange={() => onSelect(method.id)}
                disabled={disabled}
                className="w-4 h-4 text-primary border-gray-300"
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900">
                  {method.name}
                </span>
                {method.description && (
                  <p className="text-sm text-gray-500">{method.description}</p>
                )}
              </div>
            </label>

            {isSelected && renderContent && (
              <div className="px-4 pb-4 pt-0">{renderContent(method)}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
