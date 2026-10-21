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
export const CONTAINER = "mx-auto w-full max-w-6xl px-4 sm:px-6";

export const PRIMARY_BUTTON =
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

export const SECONDARY_BUTTON =
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-navy/20 bg-white px-5 py-2.5 text-sm font-semibold text-navy hover:border-navy/40 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

// Patient Portal for signed-out users, My Portal for signed-in users
export function usePortalLink() {
  const { role, loading } = useAuth();
  return role
    ? { to: `/${role}/dashboard`, label: "My Portal", loading }
    : { to: "/login", label: "Patient Portal", loading };
}
