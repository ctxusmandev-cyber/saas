import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRestaurant } from "@/lib/restaurant-context";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export interface CustomerUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
}

interface CustomerAuthState {
  user: CustomerUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<{ error?: string }>;
  logout: () => void;
  updateProfile: (data: { name?: string; phone?: string }) => Promise<{ error?: string }>;
}

const CustomerAuthContext = createContext<CustomerAuthState | null>(null);

function getStorageKey(slug: string) {
  return `terra_auth_${slug}`;
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const { restaurant } = useRestaurant();
  const slug = (restaurant as any)?.slug ?? "terra";
  const storageKey = getStorageKey(slug);

  const [user, setUser] = useState<CustomerUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const { token: t, user: u } = JSON.parse(stored);
        setToken(t);
        setUser(u);
        verifyAndRefresh(t);
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
    setLoading(false);
  }, [storageKey]);

  const verifyAndRefresh = async (t: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${t}`, "x-restaurant-slug": slug },
      });
      if (res.ok) {
        const u = await res.json();
        setUser(u);
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          localStorage.setItem(storageKey, JSON.stringify({ ...parsed, user: u }));
        }
      } else {
        logout();
      }
    } catch {}
  };

  const persist = (t: string, u: CustomerUser) => {
    localStorage.setItem(storageKey, JSON.stringify({ token: t, user: u }));
    setToken(t);
    setUser(u);
  };

  const logout = useCallback(() => {
    localStorage.removeItem(storageKey);
    setToken(null);
    setUser(null);
  }, [storageKey]);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-restaurant-slug": slug },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error ?? "Login failed" };
    persist(data.token, data.user);
    return {};
  };

  const register = async (name: string, email: string, password: string, phone?: string): Promise<{ error?: string }> => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-restaurant-slug": slug },
      body: JSON.stringify({ name, email, password, phone }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error ?? "Registration failed" };
    persist(data.token, data.user);
    return {};
  };

  const updateProfile = async (updates: { name?: string; phone?: string }): Promise<{ error?: string }> => {
    if (!token) return { error: "Not logged in" };
    const res = await fetch(`${API_BASE}/api/auth/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "x-restaurant-slug": slug },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error ?? "Update failed" };
    const updated = { ...user!, ...data };
    persist(token, updated);
    return {};
  };

  return (
    <CustomerAuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  return ctx;
}
