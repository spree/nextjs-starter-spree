"use server"

import { getSpreeClient } from "@/lib/spree"
import { getAuthHeadersWithRefresh, setAuthToken, removeAuthToken } from "./cookies"
import { withAuthRefresh } from "./auth-request"
import { associateCartWithUser } from "./cart"
import { updateTag } from "next/cache"

export async function getCustomer() {
  const authHeaders = await getAuthHeadersWithRefresh()

  if (!authHeaders.token) {
    return null
  }

  try {
    return await withAuthRefresh(async (headers) => {
      const client = getSpreeClient()
      return await client.customer.get(headers)
    })
  } catch {
    // Any error means we can't get customer - clear token and return null
    await removeAuthToken()
    return null
  }
}

export async function login(email: string, password: string) {
  const client = getSpreeClient()

  try {
    const response = await client.auth.login({ email, password })
    await setAuthToken(response.token)

    // Associate any guest cart with the newly authenticated user
    await associateCartWithUser()

    updateTag("customer")
    return { success: true, user: response.user }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Invalid email or password"
    }
  }
}

export async function register(
  email: string,
  password: string,
  passwordConfirmation: string
) {
  const client = getSpreeClient()

  try {
    const response = await client.auth.register({
      email,
      password,
      password_confirmation: passwordConfirmation,
    })
    await setAuthToken(response.token)

    // Associate any guest cart with the newly registered user
    await associateCartWithUser()

    updateTag("customer")
    return { success: true, user: response.user }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Registration failed"
    }
  }
}

export async function logout() {
  await removeAuthToken()
  updateTag("customer")
}

export async function updateCustomer(data: {
  first_name?: string
  last_name?: string
  email?: string
}) {
  try {
    const customer = await withAuthRefresh(async (headers) => {
      const client = getSpreeClient()
      return await client.customer.update(data, headers)
    })
    updateTag("customer")
    return { success: true, customer }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed"
    }
  }
}
