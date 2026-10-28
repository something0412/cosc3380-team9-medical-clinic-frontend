import { useAuth } from "../../context/AuthContext";
import { NurseDashboard } from "../nurse/Dashboard";
import { ReceptionistDashboard } from "../receptionist/Dashboard";

// nurses and receptionists share /staff/dashboard, so show the one for this employee type
export function StaffDashboard() {
  const { user } = useAuth();

  if (user?.employeeType === "Nurse") return <NurseDashboard />;
  if (user?.employeeType === "Receptionist") return <ReceptionistDashboard />;
  return <p className="text-slate-600">No dashboard for this staff type.</p>;
}
