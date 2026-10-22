import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../context/AuthContext";
import type { StaffType } from "../types";

// Each role only sees its own links here — this is what keeps patients
// from seeing doctor tabs, etc. Add a new page's link to its role's array
// as pages get built out.
//
// Staff links can also be limited by `staffTypes`: nurses and
// receptionists share the "staff" role but see different pages. Links
// without `staffTypes` show for every staff member.
const ROLE_LINKS: Record<Role, { to: string; label: string; staffTypes?: StaffType[] }[]> = {
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
        { to: "/admin/analytics", label: "Analytics" },
        { to: "/admin/profile", label: "My Profile" },
    ],
    staff: [
        // Staff who are neither nurses nor receptionists only get this.
        { to: "/staff/dashboard", label: "Dashboard", staffTypes: ["other"] },
        // Front desk: receptionists only.
        { to: "/staff/front-desk", label: "Front Desk", staffTypes: ["receptionist"] },
        { to: "/staff/patients", label: "Patients", staffTypes: ["receptionist"] },
        { to: "/staff/schedule", label: "Schedule", staffTypes: ["receptionist"] },
        { to: "/staff/billing", label: "Billing", staffTypes: ["receptionist"] },
        // Nursing pages.
        { to: "/staff/rn", label: "Clinical Queue", staffTypes: ["nurse"] },
        { to: "/staff/charts", label: "Patient Charts", staffTypes: ["nurse"] },
        { to: "/staff/supplies", label: "Supplies", staffTypes: ["nurse"] },
        // Every staff member.
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
        <nav className="sticky top-0 flex h-screen w-48 shrink-0 flex-col border-r border-gray-200 bg-white print:hidden">
            <div className="border-b border-gray-200 px-4 py-4">
                <span className="text-sm font-semibold text-gray-900">
                    Medical Clinic
                </span>
                <p className="mt-0.5 text-xs text-gray-500 capitalize">
                    {user ? `${user.firstName} ${user.lastName} · ${role}` : role}
                </p>
            </div>

            <ul className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {ROLE_LINKS[role]
                    .filter((link) => !link.staffTypes || (user?.staffType && link.staffTypes.includes(user.staffType)))
                    .map((link) => (
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
