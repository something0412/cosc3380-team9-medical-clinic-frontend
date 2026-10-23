import { useAuth } from "../../context/AuthContext";
import type { Role } from "../../context/AuthContext";

// public site navigation (the logo links home)
export const PUBLIC_LINKS = [
  { to: "/find-a-doctor", label: "Find a Doctor" },
  { to: "/locations", label: "Locations" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
];

// page width used by every public section
export const CONTAINER = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";

export const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600";

export const PRIMARY_BUTTON = `inline-flex items-center justify-center whitespace-nowrap rounded-md bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-dark ${FOCUS}`;

export const SECONDARY_BUTTON = `inline-flex items-center justify-center whitespace-nowrap rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-navy hover:bg-slate-50 ${FOCUS}`;

// section headings; add a text color where used
export const SECTION_HEADING = "font-heading text-3xl font-semibold leading-tight text-balance lg:text-4xl";

// small uppercase label above headings (also used by admin pages)
export const EYEBROW = "text-xs font-semibold uppercase tracking-[0.14em] text-teal-600";

// existing appointment pages; other roles use their dashboard
const APPOINTMENT_PAGES: Partial<Record<Role, string>> = {
  patient: "/patient/appointments",
  staff: "/staff/appointment",
};

// portal and appointment links based on who is signed in
export function usePortalLink() {
  const { role, loading } = useAuth();
  const isEmployee = role !== null && role !== "patient";
  return {
    loading,
    isEmployee,
    to: role ? `/${role}/dashboard` : "/login",
    label: isEmployee ? "Employee Portal" : role ? "My Portal" : "Patient Portal",
    appointmentsTo: role ? (APPOINTMENT_PAGES[role] ?? `/${role}/dashboard`) : "/login",
  };
}
