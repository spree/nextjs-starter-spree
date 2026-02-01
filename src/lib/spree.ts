import { createSpreeClient, SpreeClient } from '@spree/sdk'

let client: SpreeClient | null = null

export function getSpreeClient(): SpreeClient {
  if (!client) {
    client = createSpreeClient({
      baseUrl: process.env.NEXT_PUBLIC_SPREE_API_URL || 'http://localhost:3000',
      apiKey: process.env.NEXT_PUBLIC_SPREE_API_KEY || '',
    })
  }
  return client
}

export { SpreeClient }
