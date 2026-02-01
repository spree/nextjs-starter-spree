'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { getSpreeClient } from '@/lib/spree'
import type { AuthTokens } from '@spree/sdk'

interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, passwordConfirmation: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'spree_auth_token'
const REFRESH_TOKEN_KEY = 'spree_refresh_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Save tokens to localStorage
  const saveTokens = useCallback((tokens: AuthTokens) => {
    localStorage.setItem(TOKEN_KEY, tokens.access_token)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
    setToken(tokens.access_token)
  }, [])

  // Clear tokens from localStorage
  const clearTokens = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  // Fetch current user
  const fetchUser = useCallback(async (accessToken: string) => {
    try {
      const client = getSpreeClient()
      const response = await client.customer.get({ token: accessToken })
      setUser({
        id: response.id,
        email: response.email,
        first_name: response.first_name,
        last_name: response.last_name,
      })
      return true
    } catch {
      return false
    }
  }, [])

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY)

      if (storedToken) {
        setToken(storedToken)
        const success = await fetchUser(storedToken)

        if (!success) {
          // Token might be expired, try to refresh
          const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
          if (refreshToken) {
            try {
              const client = getSpreeClient()
              const tokens = await client.auth.refresh(refreshToken)
              saveTokens(tokens)
              await fetchUser(tokens.access_token)
            } catch {
              clearTokens()
            }
          } else {
            clearTokens()
          }
        }
      }

      setLoading(false)
    }

    initAuth()
  }, [fetchUser, saveTokens, clearTokens])

  // Login
  const login = useCallback(async (email: string, password: string) => {
    const client = getSpreeClient()
    const tokens = await client.auth.login({ email, password })
    saveTokens(tokens)
    await fetchUser(tokens.access_token)
  }, [saveTokens, fetchUser])

  // Register
  const register = useCallback(async (email: string, password: string, passwordConfirmation: string) => {
    const client = getSpreeClient()
    const tokens = await client.auth.register({
      email,
      password,
      password_confirmation: passwordConfirmation,
    })
    saveTokens(tokens)
    await fetchUser(tokens.access_token)
  }, [saveTokens, fetchUser])

  // Logout
  const logout = useCallback(() => {
    clearTokens()
  }, [clearTokens])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
