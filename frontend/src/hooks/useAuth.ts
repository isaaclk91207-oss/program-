import { useState, useEffect, useCallback } from "react";
import { login as apiLogin, getMe } from "../services/api";
import type { User } from "../types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("pccp_user");
    const token = localStorage.getItem("pccp_token");
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("pccp_user");
        localStorage.removeItem("pccp_token");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin({ email, password });
    localStorage.setItem("pccp_token", result.token);
    localStorage.setItem("pccp_user", JSON.stringify(result.user));
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("pccp_token");
    localStorage.removeItem("pccp_user");
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const u = await getMe();
      setUser(u as User);
    } catch {
      logout();
    }
  }, [logout]);

  return { user, loading, login, logout, refreshUser };
}
