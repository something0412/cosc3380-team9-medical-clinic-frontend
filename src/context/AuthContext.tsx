import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Role = "patient" | "doctor" | "admin" | "staff";

const ROLES: Role[] = ["patient", "doctor", "admin", "staff"];

interface AuthContextValue {
  role: Role | null;
  login: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Temporary until real auth exists: the chosen role is kept in localStorage
// so a page refresh while designing a role's pages doesn't bounce back to
// the login screen.
const STORAGE_KEY = "clinic_role";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return ROLES.includes(stored as Role) ? (stored as Role) : null;
  });

  useEffect(() => {
    if (role) {
      localStorage.setItem(STORAGE_KEY, role);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [role]);

  return (
    <AuthContext.Provider value={{ role, login: setRole, logout: () => setRole(null) }}>
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
