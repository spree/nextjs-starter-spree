"use server";

import { getStore as _getStore } from "@spree/next";

export async function getStore(options?: { locale?: string; currency?: string }) {
  return _getStore(options);
}
