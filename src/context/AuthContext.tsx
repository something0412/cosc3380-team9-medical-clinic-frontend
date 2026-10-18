import { createContext, useContext, useEffect, useState } from "react";

import type { ReactNode } from "react";
import { api } from "../api";

export type Role = "patient" | "doctor" | "admin" | "staff";

const ROLES: Role[] = ["patient", "doctor", "admin", "staff"];

export interface AuthUser {
  role: Role;
  id: number;
  firstName: string;
  lastName: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  role: Role | null;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "clinic_user";

function loadUser(): AuthUser | null {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    return stored && ROLES.includes(stored.role) ? stored : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  function logout() {
    setUser(null);
    // Clear the verified server-side session as well as the browser UI state.
    void api.post("/api/auth/logout").catch((error) => {
      console.error("Could not log out on the server:", error);
    });
  }

  return (
    <AuthContext.Provider value={{ user, role: user?.role ?? null, login: setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
