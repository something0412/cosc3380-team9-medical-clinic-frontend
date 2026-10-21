import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { CONTAINER, PRIMARY_BUTTON, PUBLIC_LINKS, usePortalLink } from "./shared";

export function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  // close the mobile menu with Escape
  useEffect(() => {
    if (!menuOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className={`${CONTAINER} flex items-center justify-between gap-6 py-3`}>
        <Link to="/" onClick={closeMenu} className="flex shrink-0 items-center gap-2.5 text-navy">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" />
            </svg>
          </span>
          <span className="text-lg font-bold tracking-tight">Medical Clinic</span>
        </Link>

        {/* desktop navigation */}
        <nav aria-label="Main" className="hidden xl:block">
          <ul className="flex items-center gap-6">
            {PUBLIC_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }) =>
                    `border-b-2 py-1 text-sm font-medium ${
                      isActive ? "border-teal-500 text-navy" : "border-transparent text-navy/80 hover:text-blue-600"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <PortalButton />
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="rounded-lg p-2 text-navy hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600 xl:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* mobile and tablet navigation */}
      {menuOpen && (
        <nav id="mobile-menu" aria-label="Main" className="border-t border-gray-200 xl:hidden">
          <ul className={`${CONTAINER} space-y-1 py-3`}>
            {PUBLIC_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === "/"}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2.5 font-medium ${
                      isActive ? "bg-slate-100 text-navy" : "text-navy/80 hover:bg-slate-50"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li className="pt-2 sm:hidden">
              <PortalButton className="w-full" onClick={closeMenu} />
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

function PortalButton({ className = "", onClick }: { className?: string; onClick?: () => void }) {
  const portal = usePortalLink();

  // keep the space while auth loads so the wrong label never flashes
  if (portal.loading) {
    return (
      <span aria-hidden="true" className={`${PRIMARY_BUTTON} invisible ${className}`}>
        Patient Portal
      </span>
    );
  }

  return (
    <Link to={portal.to} onClick={onClick} className={`${PRIMARY_BUTTON} ${className}`}>
      {portal.label}
    </Link>
  );
}
