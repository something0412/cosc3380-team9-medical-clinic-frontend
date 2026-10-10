import { Navigate, Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../context/AuthContext";

// Shared shell for every role's section: sidebar + whatever page is routed
// into the Outlet. `role` is the section this layout guards — if the
// logged-in role doesn't match (or nobody's logged in), bounce to login
// instead of leaking another role's pages.
export function RoleLayout({ role }: { role: Role }) {
  const { role: currentRole } = useAuth();

  if (currentRole !== role) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
