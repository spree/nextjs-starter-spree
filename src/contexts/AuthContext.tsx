'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { getSpreeClient } from '@/lib/spree'
import type { AuthTokens } from '@spree/sdk'

interface User {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Save auth response to state and localStorage
  const saveAuth = useCallback((response: AuthTokens) => {
    localStorage.setItem(TOKEN_KEY, response.token)
    setToken(response.token)
    setUser({
      id: response.user.id,
      email: response.user.email,
      first_name: response.user.first_name,
      last_name: response.user.last_name,
    })
  }, [])

  // Clear auth from localStorage
  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  // Fetch current user (for restoring session)
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
          // Token is expired or invalid, try to refresh
          try {
            const client = getSpreeClient()
            const response = await client.auth.refresh({ token: storedToken })
            saveAuth(response)
          } catch {
            clearAuth()
          }
        }
      }

      setLoading(false)
    }

    initAuth()
  }, [fetchUser, saveAuth, clearAuth])

  // Login
  const login = useCallback(async (email: string, password: string) => {
    const client = getSpreeClient()
    const response = await client.auth.login({ email, password })
    saveAuth(response)
  }, [saveAuth])

  // Register
  const register = useCallback(async (email: string, password: string, passwordConfirmation: string) => {
    const client = getSpreeClient()
    const response = await client.auth.register({
      email,
      password,
      password_confirmation: passwordConfirmation,
    })
    saveAuth(response)
  }, [saveAuth])

  // Logout
  const logout = useCallback(() => {
    clearAuth()
  }, [clearAuth])

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
