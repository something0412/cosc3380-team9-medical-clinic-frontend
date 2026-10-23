import { Navigate, Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../context/AuthContext";

// page layout for each role
export function RoleLayout({ role }: { role: Role }) {
  const { role: currentRole, loading } = useAuth();

  if (loading) {
    return <p className="p-6 text-gray-500">Loading...</p>;
  }

  if (currentRole !== role) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} />
      <main className="min-w-0 flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
