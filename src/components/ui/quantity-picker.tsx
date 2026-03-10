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
      ? "px-4 font-medium min-w-[3rem] text-center"
      : "px-3 py-2 text-sm font-medium min-w-[2rem] text-center";

  return (
    <div className="flex items-center border border-gray-300 rounded-xl">
      <Button
        variant="ghost"
        size={buttonSize}
        className="rounded-l-xl rounded-r-none disabled:opacity-30"
        disabled={disabled || quantity <= 1}
        onClick={onDecrement}
        aria-label="Decrease quantity"
      >
        <Minus className="w-4 h-4" />
      </Button>
      <span className={spanClass}>{quantity}</span>
      <Button
        variant="ghost"
        size={buttonSize}
        className="rounded-r-xl rounded-l-none disabled:opacity-30"
        disabled={disabled}
        onClick={onIncrement}
        aria-label="Increase quantity"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}
