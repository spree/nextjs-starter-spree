"use client";

import dynamic from "next/dynamic";

const CountrySwitcher = dynamic(() =>
  import("@/components/layout/CountrySwitcher").then((mod) => ({
    default: mod.CountrySwitcher,
  })),
);

export function LazyCountrySwitcher() {
  return <CountrySwitcher />;
}
