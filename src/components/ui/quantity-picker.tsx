"use client";

import { Minus, Plus } from "lucide-react";
import * as React from "react";
import { Button } from "./button";

export interface QuantityPickerProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  decrementLabel: string;
  incrementLabel: string;
  quantityLabel: string;
  disabled?: boolean;
  size?: "sm" | "lg";
}

export function QuantityPicker({
  quantity,
  onQuantityChange,
  decrementLabel,
  incrementLabel,
  quantityLabel,
  disabled = false,
  size = "sm",
}: QuantityPickerProps): React.JSX.Element {
  // Holds the raw text while the user is typing; null means "not editing",
  // so the displayed value tracks the quantity prop between edits without
  // needing an effect to sync them.
  const [draft, setDraft] = React.useState<string | null>(null);

  const commitDraft = () => {
    if (draft === null) return;
    setDraft(null);
    const parsed = Number.parseInt(draft, 10);
    if (Number.isNaN(parsed)) return;
    const next = Math.max(1, parsed);
    if (next !== quantity) {
      onQuantityChange(next);
    }
  };

  const buttonSize = size === "lg" ? "icon-lg" : "icon";
  const inputClass =
    size === "lg"
      ? "w-12 bg-transparent text-center font-medium tabular-nums outline-none disabled:opacity-50"
      : "w-10 bg-transparent py-2 text-center text-sm font-medium tabular-nums outline-none disabled:opacity-50";

  return (
    <div className="flex items-center border border-gray-300 rounded-lg px-0.5 focus-within:border-gray-500">
      <Button
        type="button"
        variant="ghost"
        size={buttonSize}
        className="rounded-md disabled:opacity-30"
        disabled={disabled || quantity <= 1}
        onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
        aria-label={decrementLabel}
      >
        <Minus className="w-3 h-3" />
      </Button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        value={draft ?? String(quantity)}
        disabled={disabled}
        aria-label={quantityLabel}
        className={inputClass}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
        onFocus={(e) => e.target.select()}
        onBlur={commitDraft}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            setDraft(null);
          }
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size={buttonSize}
        className="rounded-md disabled:opacity-30"
        disabled={disabled}
        onClick={() => onQuantityChange(quantity + 1)}
        aria-label={incrementLabel}
      >
        <Plus className="w-3 h-3" />
      </Button>
    </div>
  );
}
