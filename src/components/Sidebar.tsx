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
        { to: "/doctor/appointments", label: "Appointments" },
        { to: "/doctor/patients", label: "Patients" },
        { to: "/doctor/lab-orders", label: "Lab Orders" },
        { to: "/doctor/referrals", label: "Referrals" },
        { to: "/doctor/schedule", label: "My Schedule" },
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
    // nurses and receptionists both log in as staff; their links are below
    staff: [],
    lab: [
        { to: "/lab/dashboard", label: "Dashboard" },
        { to: "/lab/orders", label: "Lab Orders" },
        { to: "/lab/profile", label: "My Profile" },
    ],
};

// staff sidebar links for each employee type
const STAFF_LINKS: Record<string, { to: string; label: string }[]> = {
    Nurse: [
        { to: "/staff/dashboard", label: "Dashboard" },
        { to: "/staff/nurse/today", label: "Today's Patients" },
        { to: "/staff/nurse/patients", label: "Patients" },
        { to: "/staff/nurse/supplies", label: "Supplies" },
        { to: "/staff/profile", label: "My Profile" },
    ],
    Receptionist: [
        { to: "/staff/dashboard", label: "Dashboard" },
        { to: "/staff/reception/appointments", label: "Appointments" },
        { to: "/staff/reception/patients", label: "Patients" },
        { to: "/staff/reception/billing", label: "Billing" },
        { to: "/staff/profile", label: "My Profile" },
    ],
};

export function Sidebar({ role }: { role: Role }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const links = role === "staff" ? (STAFF_LINKS[user?.employeeType ?? ""] ?? []) : ROLE_LINKS[role];
    const roleLabel = role === "staff" && user?.employeeType ? user.employeeType : role;

    function handleLogout() {
        logout();
        navigate(role === "patient" ? "/login" : "/employee/login", { replace: true });
    }

    return (
        <nav className="sticky top-0 flex h-screen w-48 shrink-0 flex-col border-r border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-4">
                <span className="text-sm font-semibold text-gray-900">
                    Medical Clinic
                </span>
                <p className="mt-0.5 text-xs text-gray-500 capitalize">
                    {user
                        ? `${user.firstName} ${user.lastName} · ${roleLabel}`
                        : roleLabel}
                </p>
            </div>

            <ul className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {links.map((link) => (
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
