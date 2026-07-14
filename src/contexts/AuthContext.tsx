"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  login as loginAction,
  logout as logoutAction,
  register as registerAction,
  syncSession,
} from "@/lib/data/customer";

export interface User {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (params: {
    email: string;
    password: string;
    password_confirmation: string;
    first_name?: string;
    last_name?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toUser(customer: User): User {
  return {
    id: customer.id,
    email: customer.email,
    first_name: customer.first_name,
    last_name: customer.last_name,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch current user from server, refreshing an expired JWT when possible.
  // A transparent refresh persists a new token via a Server Action (cookie
  // writes aren't allowed during a Server Component render), so re-render the
  // server components afterwards to replace any data they fetched with the
  // stale session.
  const refreshUser = useCallback(async () => {
    try {
      const { customer, refreshed } = await syncSession();
      setUser(customer ? toUser(customer) : null);
      if (refreshed) {
        router.refresh();
      }
    } catch {
      setUser(null);
    }
  }, [router]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      await refreshUser();
      setLoading(false);
    };
    initAuth();
  }, [refreshUser]);

  // Login
  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginAction(email, password);
      if (result.success && result.user) {
        setUser(toUser(result.user));
        router.refresh();
      }
      return result;
    },
    [router],
  );

  // Register
  const register = useCallback(
    async (params: {
      email: string;
      password: string;
      password_confirmation: string;
      first_name?: string;
      last_name?: string;
    }) => {
      const result = await registerAction(params);
      if (result.success && result.user) {
        setUser(toUser(result.user));
        router.refresh();
      }
      return result;
    },
    [router],
  );

  // Logout
  const logout = useCallback(async () => {
    await logoutAction();
    setUser(null);
    router.refresh();
  }, [router]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      isAuthenticated: !!user,
    }),
    [user, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
