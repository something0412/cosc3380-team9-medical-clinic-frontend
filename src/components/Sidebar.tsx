import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../context/AuthContext";

// sidebar links for each role
const ROLE_LINKS: Record<Role, { to: string; label: string }[]> = {
    patient: [
        { to: "/patient/dashboard", label: "Dashboard" },
        { to: "/patient/appointments", label: "Appointments" },
        { to: "/patient/records", label: "Medical Records" },
        { to: "/patient/forms", label: "Forms" },
        { to: "/patient/billing", label: "Billing" },
        { to: "/patient/profile", label: "My Profile" },
    ],
    doctor: [
        { to: "/doctor/dashboard", label: "Dashboard" },
        { to: "/doctor/profile", label: "My Profile" },
    ],
    admin: [
        { to: "/admin/dashboard", label: "Dashboard" },
        { to: "/admin/employees", label: "Employees" },
        { to: "/admin/offices", label: "Offices" },
        { to: "/admin/specialties", label: "Specialties" },
        { to: "/admin/schedules", label: "Schedules" },
        { to: "/admin/analytics", label: "Analytics" },
        { to: "/admin/staff", label: "Staff" },
        { to: "/admin/patients", label: "Patients" },
        { to: "/admin/profile", label: "My Profile" },
    ],
    staff: [
        { to: "/staff/dashboard", label: "Dashboard" },
        { to: "/staff/appointment", label: "Patient Appointments" },
        // Nursing pages: one shared chart lookup + one tab per nurse type.
        { to: "/staff/charts", label: "Patient Charts" },
        { to: "/staff/rn", label: "RN Workspace" },
        { to: "/staff/crna", label: "CRNA Workspace" },
        { to: "/staff/na", label: "NA Workspace" },
        { to: "/staff/profile", label: "My Profile" },
    ],
};

export function Sidebar({ role }: { role: Role }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate("/login", { replace: true });
    }

    return (
        <nav className="sticky top-0 flex h-screen w-48 shrink-0 flex-col border-r border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-4">
                <span className="text-sm font-semibold text-gray-900">
                    Medical Clinic
                </span>
                <p className="mt-0.5 text-xs text-gray-500 capitalize">
                    {user ? `${user.firstName} ${user.lastName} · ${role}` : role}
                </p>
            </div>

            <ul className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {ROLE_LINKS[role].map((link) => (
                    <li key={link.to}>
                        <NavLink
                            to={link.to}
                            className={({ isActive }) =>
                                `block rounded px-3 py-2 text-sm ${
                                    isActive
                                        ? "bg-gray-100 font-medium text-gray-900"
                                        : "text-gray-600 hover:bg-gray-50"
                                }`
                            }
                        >
                            {link.label}
                        </NavLink>
                    </li>
                ))}
            </ul>

            <div className="border-t border-gray-200 px-3 py-4">
                <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50"
                >
                    Log Out
                </button>
            </div>
        </nav>
    );
}
