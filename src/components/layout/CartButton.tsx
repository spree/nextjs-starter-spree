"use client";

import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

export function CartButton() {
  const { itemCount, openCart } = useCart();

  return (
    <Button
      variant="ghost"
      size="icon-lg"
      onClick={openCart}
      aria-label="Open cart"
      className="relative"
    >
      <ShoppingBag className="size-5" />
      {itemCount > 0 && (
        <span className="absolute top-0 right-0 bg-primary text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </Button>
  );
}
