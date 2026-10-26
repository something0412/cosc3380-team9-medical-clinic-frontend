import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { LogoMark } from "./icons";
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
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className={`${CONTAINER} flex h-18 items-center justify-between gap-6`}>
        <Link
          to="/"
          onClick={closeMenu}
          aria-label="Medical Clinic home"
          className="flex shrink-0 items-center gap-3 rounded-lg text-navy focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600"
        >
          <LogoMark />
          <span className="leading-tight">
            <span className="block text-lg font-bold tracking-tight">Medical Clinic</span>
            <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-teal-700">Primary &amp; Specialty Care</span>
          </span>
        </Link>

        {/* desktop navigation */}
        <nav aria-label="Main" className="hidden h-full lg:block">
          <ul className="flex h-full items-center gap-6 xl:gap-8">
            {PUBLIC_LINKS.map((link) => (
              <li key={link.to} className="h-full">
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `flex h-full items-center whitespace-nowrap border-b-2 pt-0.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-600 ${
                      isActive ? "border-teal-600 text-navy" : "border-transparent text-slate-600 hover:border-slate-300 hover:text-navy"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <PortalButton />
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="rounded-md p-2 text-navy hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-teal-600 lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* mobile and tablet navigation */}
      {menuOpen && (
        <nav id="mobile-menu" aria-label="Main" className="border-t border-slate-200 bg-white shadow-md lg:hidden">
          <ul className={`${CONTAINER} py-3`}>
            {PUBLIC_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `block rounded-md border-l-2 px-4 py-3 font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-600 ${
                      isActive ? "border-teal-600 bg-slate-50 text-navy" : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-navy"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li className="pt-3 sm:hidden">
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
