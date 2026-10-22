import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LogoMark } from "./icons";
import { CONTAINER, PUBLIC_LINKS } from "./shared";

export function PublicFooter() {
  return (
    <footer className="bg-navy-dark text-white">
      <div className={`${CONTAINER} grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:gap-12`}>
        <div>
          <Link to="/" className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <LogoMark className="h-10 w-10 bg-white text-navy" />
            <span className="text-lg font-bold tracking-tight">Medical Clinic</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
            Primary and specialty care at clinic offices across several states.
          </p>
        </div>

        <FooterColumn title="Explore">
          {PUBLIC_LINKS.map((link) => (
            <FooterLink key={link.to} to={link.to}>
              {link.label}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Patients">
          <FooterLink to="/login">Patient Portal</FooterLink>
          <FooterLink to="/find-a-doctor">Find a Doctor</FooterLink>
          <FooterLink to="/services">Services</FooterLink>
        </FooterColumn>

        <FooterColumn title="Contact">
          <li className="text-sm leading-relaxed text-white/70">
            Phone numbers and addresses for each office are listed on our locations page.
          </li>
          <FooterLink to="/contact">Contact Us</FooterLink>
          <FooterLink to="/locations">Find a Location</FooterLink>
        </FooterColumn>
      </div>

      <div className="border-t border-white/10">
        <div className={`${CONTAINER} flex flex-col gap-3 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between`}>
          <p>© {new Date().getFullYear()} Medical Clinic. All rights reserved.</p>
          <Link to="/login" className="rounded hover:text-white focus-visible:outline-2 focus-visible:outline-white">
            Employee Access
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-300">{title}</h2>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: string }) {
  return (
    <li>
      <Link to={to} className="rounded text-sm text-white/75 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-white">
        {children}
      </Link>
    </li>
  );
}
