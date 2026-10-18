import { createContext, useContext, useEffect, useState } from "react";

import type { ReactNode } from "react";
import { api } from "../api";

export type Role = "patient" | "doctor" | "admin" | "staff";

export interface AuthUser {
  role: Role;
  id: number;
  firstName: string;
  lastName: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  role: Role | null;
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // load the logged-in user from the session
  useEffect(() => {
    api
      .get<AuthUser>("/api/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // session expired: send back to login
  useEffect(() => {
    const interceptor = api.interceptors.response.use(undefined, (error) => {
      if (error.response?.status === 401) setUser(null);
      return Promise.reject(error);
    });
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  function logout() {
    setUser(null);
    api.post("/api/auth/logout").catch((error) => {
      console.error("Could not log out on the server:", error);
    });
  }

  return (
    <AuthContext.Provider value={{ user, role: user?.role ?? null, loading, login: setUser, logout }}>
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
