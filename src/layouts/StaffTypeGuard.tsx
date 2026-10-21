import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { StaffType } from "../types";

// Wraps staff pages that only one kind of staff may open (e.g. billing is
// receptionists only). Hiding the sidebar link isn't enough on its own:
// anyone could still type /staff/billing into the address bar. The
// backend checks too — this just keeps the wrong people off the page.
export function StaffTypeGuard({ staffType }: { staffType: StaffType }) {
  const { user } = useAuth();

  if (user?.staffType !== staffType) {
    return <Navigate to="/staff/dashboard" replace />;
  }

  return <Outlet />;
}
