"use server"

import { getSpreeClient } from "@/lib/spree"

export async function getStore() {
  const client = getSpreeClient()
  return client.store.get()
}
