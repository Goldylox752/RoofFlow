// hooks/useAuth.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import * as authAPI from "@/lib/api/auth";

export interface User {
  id: string;
  email: string;
  name?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized loadUser – prevents infinite re-renders
  const loadUser = useCallback(async () => {
    try {
      setError(null);
      const res = await authAPI.getMe();
      setUser(res?.user || null);
    } catch (err: any) {
      setUser(null);
      setError(err?.message || "Failed to load user");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      const res = await authAPI.login({ email, password });
      await loadUser();
      return { success: true, data: res };
    } catch (err: any) {
      const msg = err?.message || "Login failed";
      setError(msg);
      return { success: false, error: msg };
    }
  }, [loadUser]);

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    try {
      setError(null);
      const res = await authAPI.signup({ email, password, name });
      await loadUser();
      return { success: true, data: res };
    } catch (err: any) {
      const msg = err?.message || "Signup failed";
      setError(msg);
      return { success: false, error: msg };
    }
  }, [loadUser]);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Logout failed");
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    refresh: loadUser,
  };
}