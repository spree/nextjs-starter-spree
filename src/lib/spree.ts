import { createSpreeClient, SpreeClient } from '@spree/sdk'

// Server-side only Spree client
// No NEXT_PUBLIC_ prefix means these env vars are NOT exposed to the browser
let client: SpreeClient | null = null

export function getSpreeClient(): SpreeClient {
  if (!client) {
    client = createSpreeClient({
      baseUrl: process.env.SPREE_API_URL || 'http://localhost:3000',
      apiKey: process.env.SPREE_API_KEY || '',
    })
  }
  return client
}

export { SpreeClient }
