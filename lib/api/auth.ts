"use client";

import { useEffect, useState } from "react";
import * as authAPI from "@/lib/api/auth";

/* ===============================
   AUTH HOOK
=============================== */
export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

/* ===============================
   LOAD CURRENT USER
=============================== */
  const loadUser = async () => {
    try {
      const res = await authAPI.getMe();
      setUser(res?.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

/* ===============================
   LOGIN
=============================== */
  const login = async (email: string, password?: string) => {
    const res = await authAPI.login({ email, password });
    await loadUser();
    return res;
  };

/* ===============================
   SIGNUP
=============================== */
  const signup = async (email: string, password?: string, name?: string) => {
    const res = await authAPI.signup({ email, password, name });
    await loadUser();
    return res;
  };

/* ===============================
   LOGOUT
=============================== */
  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

/* ===============================
   INIT
=============================== */
  useEffect(() => {
    loadUser();
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    refresh: loadUser,
  };
}