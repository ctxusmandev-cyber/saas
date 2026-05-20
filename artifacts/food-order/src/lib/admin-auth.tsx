import React, { createContext, useContext, useState, useCallback } from "react";

const SUPER_ADMIN_PASSWORD = "super@terra2024";
const SESSION_KEY = "terra_admin_auth";
const SUPER_SESSION_KEY = "terra_super_admin_auth";

export interface AdminSession {
  restaurantId: number;
  slug: string;
  name: string;
}

interface AdminAuthContextType {
  session: AdminSession | null;
  isAuthenticated: boolean;
  login: (slug: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (slug: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`/api/restaurants/${slug}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.error || "Invalid password" };
      }

      const data: AdminSession = await res.json();
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
      setSession(data);
      return { success: true };
    } catch {
      return { success: false, error: "Connection error. Please try again." };
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ session, isAuthenticated: session !== null, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}

// ─── Super admin auth ────────────────────────────────────────────────────────

interface SuperAdminContextType {
  isAuthenticated: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

export function SuperAdminProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(SUPER_SESSION_KEY) === "true";
  });

  const login = useCallback(async (password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/super-admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        sessionStorage.setItem(SUPER_SESSION_KEY, "true");
        setIsAuthenticated(true);
        return true;
      }
    } catch {}
    return false;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SUPER_SESSION_KEY);
    setIsAuthenticated(false);
  }, []);

  return (
    <SuperAdminContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </SuperAdminContext.Provider>
  );
}

export function useSuperAdmin() {
  const ctx = useContext(SuperAdminContext);
  if (!ctx) throw new Error("useSuperAdmin must be used within SuperAdminProvider");
  return ctx;
}
