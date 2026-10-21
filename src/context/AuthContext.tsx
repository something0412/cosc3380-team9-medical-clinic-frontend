import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { StaffType } from "../types";

export type Role = "patient" | "doctor" | "admin" | "staff";

const ROLES: Role[] = ["patient", "doctor", "admin", "staff"];

export interface AuthUser {
  role: Role;
  id: number;
  firstName: string;
  lastName: string;
  staffType?: StaffType; // staff only
  officeId?: number; // staff only: the office their pages are scoped to
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

  return (
    <AuthContext.Provider value={{ user, role: user?.role ?? null, login: setUser, logout: () => setUser(null) }}>
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
