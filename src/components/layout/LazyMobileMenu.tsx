"use client";

import type { Category } from "@spree/sdk";
import dynamic from "next/dynamic";

const MobileMenu = dynamic(() =>
  import("@/components/layout/MobileMenu").then((mod) => ({
    default: mod.MobileMenu,
  })),
);

interface LazyMobileMenuProps {
  rootCategories: Category[];
  basePath: string;
}

export function LazyMobileMenu({
  rootCategories,
  basePath,
}: LazyMobileMenuProps) {
  return <MobileMenu rootCategories={rootCategories} basePath={basePath} />;
}
