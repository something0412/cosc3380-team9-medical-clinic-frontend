import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Where staff land after logging in: straight to their main page.
export function StaffDashboard() {
  const { user } = useAuth();

  if (user?.staffType === "receptionist") return <Navigate to="/staff/front-desk" replace />;
  if (user?.staffType === "nurse") return <Navigate to="/staff/rn" replace />;

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Overview for staff.</p>
    </div>
  );
}
