import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../context/AuthContext";
import { LogoMark } from "./public/icons";
import { FOCUS } from "./public/shared";

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
        { to: "/admin/billing", label: "Billing" },
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
        <nav className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
            {/* logo and name, back to my dashboard */}
            <div className="border-b border-slate-200 px-4 py-4">
                <Link to={`/${role}/dashboard`} className={`flex items-center gap-2.5 rounded-lg text-navy ${FOCUS}`}>
                    <LogoMark className="h-9 w-9 bg-navy text-white" />
                    <span className="leading-tight">
                        <span className="block text-base font-bold tracking-tight">Lambda</span>
                        <span className="block text-xs font-medium text-slate-400">Medical Clinic</span>
                    </span>
                </Link>
            </div>

            {/* who is signed in */}
            <div className="border-b border-slate-200 px-4 py-3">
                <p className="truncate text-sm font-medium text-slate-900">
                    {user ? `${user.firstName} ${user.lastName}` : ""}
                </p>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-600">{roleLabel}</p>
            </div>

            <ul className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {links.map((link) => (
                    <li key={link.to}>
                        <NavLink
                            to={link.to}
                            className={({ isActive }) =>
                                `block rounded-lg px-3 py-2 text-sm ${FOCUS} ${
                                    isActive
                                        ? "bg-navy font-semibold text-white"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-navy"
                                }`
                            }
                        >
                            {link.label}
                        </NavLink>
                    </li>
                ))}
            </ul>

            <div className="border-t border-slate-200 px-3 py-4">
                <button
                    type="button"
                    onClick={handleLogout}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 hover:text-navy ${FOCUS}`}
                >
                    Log Out
                </button>
            </div>
        </nav>
    );
}
