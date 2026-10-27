import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LogoMark } from "./icons";
import { CONTAINER, usePortalLink } from "./shared";

export function PublicFooter() {
  const portal = usePortalLink();

  return (
    <footer className="bg-navy-dark text-white">
      <div className={`${CONTAINER} grid grid-cols-2 gap-x-6 gap-y-10 py-14 sm:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:gap-12`}>
        <div className="col-span-2 sm:col-span-3 lg:col-span-1">
          <Link to="/" className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <LogoMark className="h-10 w-10 bg-white text-navy" />
            <span className="text-lg font-bold tracking-tight">
              Lambda <span className="text-sm font-medium tracking-normal text-white/60">Medical Clinic</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
            Primary and specialty care across our clinic locations.
          </p>
        </div>

        <FooterColumn title="Find care">
          <FooterLink to="/find-a-doctor">Find a Doctor</FooterLink>
          <FooterLink to="/services">Services</FooterLink>
          <FooterLink to="/locations">Locations</FooterLink>
        </FooterColumn>

        <FooterColumn title="Patients">
          {/* online booking is for patients, so employees don't get the link */}
          {!portal.isEmployee && <FooterLink to="/book">Book an Appointment</FooterLink>}
          <FooterLink to={portal.to}>{portal.label}</FooterLink>
          <FooterLink to={portal.appointmentsTo}>{portal.isEmployee ? "Appointments" : "My Appointments"}</FooterLink>
        </FooterColumn>

        <FooterColumn title="Clinic">
          <FooterLink to="/about">About Us</FooterLink>
          <FooterLink to="/contact">Contact Us</FooterLink>
        </FooterColumn>
      </div>

      <div className="border-t border-white/10">
        <div className={`${CONTAINER} flex flex-col gap-3 py-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between`}>
          <p>© {new Date().getFullYear()} Lambda Medical Clinic. All rights reserved.</p>
          <Link to="/employee/login" className="self-start rounded py-1 hover:text-white focus-visible:outline-2 focus-visible:outline-white">
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
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <ul className="mt-3 space-y-1">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: string }) {
  return (
    <li>
      <Link to={to} className="inline-block rounded py-1 text-sm text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-white">
        {children}
      </Link>
    </li>
  );
}
