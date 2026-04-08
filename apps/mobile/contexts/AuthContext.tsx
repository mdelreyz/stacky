import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { auth as authApi, setToken } from "@/lib/api";
import type { User } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  updateProfile: (data: {
    first_name?: string;
    last_name?: string;
    timezone?: string;
    location_name?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }) => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    // For now, just set loading to false (no persistent storage yet)
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    setToken(result.access_token);
    setUser(result.user);
  }, []);

  const signup = useCallback(
    async (data: {
      first_name: string;
      last_name: string;
      email: string;
      password: string;
    }) => {
      const result = await authApi.signup(data);
      setToken(result.access_token);
      setUser(result.user);
    },
    []
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const nextUser = await authApi.me();
    setUser(nextUser);
  }, []);

  const updateProfile = useCallback(
    async (data: {
      first_name?: string;
      last_name?: string;
      timezone?: string;
      location_name?: string | null;
      latitude?: number | null;
      longitude?: number | null;
    }) => {
      const nextUser = await authApi.updateMe(data);
      setUser(nextUser);
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        updateProfile,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
