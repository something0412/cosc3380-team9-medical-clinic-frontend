import { useAuth } from "../../context/AuthContext";

// public site navigation
export const PUBLIC_LINKS = [
  { to: "/", label: "Home" },
  { to: "/find-a-doctor", label: "Find a Doctor" },
  { to: "/locations", label: "Locations" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
];

// page width used by every public section
export const CONTAINER = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

export const PRIMARY_BUTTON = `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 ${FOCUS}`;

export const SECONDARY_BUTTON = `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-navy/40 hover:bg-slate-50 ${FOCUS}`;

// small uppercase label above section headings
export const EYEBROW = "text-xs font-semibold uppercase tracking-[0.14em] text-teal-600";

// portal and appointment links based on who is signed in
export function usePortalLink() {
  const { role, loading } = useAuth();
  return {
    loading,
    to: role ? `/${role}/dashboard` : "/login",
    label: role ? "My Portal" : "Patient Portal",
    // only patients have an appointments page
    appointmentsTo: role === "patient" ? "/patient/appointments" : "/login",
  };
}
