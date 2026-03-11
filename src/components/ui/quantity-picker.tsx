"use client";

import { Minus, Plus } from "lucide-react";
import type * as React from "react";
import { Button } from "./button";

interface QuantityPickerProps {
  quantity: number;
  onDecrement: () => void;
  onIncrement: () => void;
  disabled?: boolean;
  size?: "sm" | "lg";
}

export function QuantityPicker({
  quantity,
  onDecrement,
  onIncrement,
  disabled = false,
  size = "sm",
}: QuantityPickerProps): React.JSX.Element {
  const buttonSize = size === "lg" ? "icon-lg" : "icon";
  const spanClass =
    size === "lg"
      ? "px-4 font-medium min-w-[3rem] text-center tabular-nums"
      : "px-3 py-2 text-sm font-medium min-w-[2rem] text-center tabular-nums";

  return (
    <div className="flex items-center border border-gray-300 rounded-lg px-0.5">
      <Button
        type="button"
        variant="ghost"
        size={buttonSize}
        className="rounded-md disabled:opacity-30"
        disabled={disabled || quantity <= 1}
        onClick={onDecrement}
        aria-label="Decrease quantity"
      >
        <Minus className="w-3 h-3" />
      </Button>
      <span className={spanClass}>{quantity}</span>
      <Button
        type="button"
        variant="ghost"
        size={buttonSize}
        className="rounded-md disabled:opacity-30"
        disabled={disabled}
        onClick={onIncrement}
        aria-label="Increase quantity"
      >
        <Plus className="w-3 h-3" />
      </Button>
    </div>
  );
}
