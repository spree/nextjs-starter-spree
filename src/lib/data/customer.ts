"use server"

import { getSpreeClient } from "@/lib/spree"
import { getAuthHeaders, setAuthToken, removeAuthToken } from "./cookies"
import { associateCartWithUser } from "./cart"
import { updateTag } from "next/cache"

export async function getCustomer() {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders.token) {
    return null
  }

  try {
    const client = getSpreeClient()
    const customer = await client.customer.get(authHeaders)
    return customer
  } catch {
    // Token is invalid or expired
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
  const authHeaders = await getAuthHeaders()

  if (!authHeaders.token) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    const client = getSpreeClient()
    const customer = await client.customer.update(data, authHeaders)
    updateTag("customer")
    return { success: true, customer }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed"
    }
  }
}
