import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CONTAINER, PRIMARY_BUTTON, SECONDARY_BUTTON, usePortalLink } from "../../components/public/shared";

export function HomePage() {
  return (
    <>
      <Hero />
      <QuickActions />
      <ServicesPreview />
      <LocationsPreview />
      <AboutPreview />
    </>
  );
}

function Hero() {
  return (
    <section className="bg-slate-50">
      <div className={`${CONTAINER} grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20`}>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-600">Care close to home</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-navy sm:text-4xl lg:text-5xl">
            Quality care for you and your family
          </h1>
          <p className="mt-4 max-w-xl text-gray-600">
            Primary and specialty care from our clinic offices across several states. Find a doctor, choose a location,
            and manage your visits online.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/find-a-doctor" className={PRIMARY_BUTTON}>
              Find a Doctor
            </Link>
            <Link to="/locations" className={SECONDARY_BUTTON}>
              Our Locations
            </Link>
          </div>
        </div>
        <ImagePlaceholder className="aspect-[4/3]" />
      </div>
    </section>
  );
}

function QuickActions() {
  const portal = usePortalLink();
  const actions = [
    { to: "/find-a-doctor", title: "Find a Doctor", text: "Search our doctors by specialty." },
    { to: "/locations", title: "Find a Location", text: "See our offices in each state." },
    { to: portal.to, title: "Patient Portal", text: "View appointments, records, and billing." },
    { to: "/services", title: "Our Services", text: "Explore the care we provide." },
  ];

  return (
    <section aria-label="Quick actions" className={`${CONTAINER} py-12`}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <li key={action.title}>
            <Link
              to={action.to}
              className="block h-full rounded-xl border border-gray-200 p-5 hover:border-blue-600 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <h2 className="font-semibold text-navy">{action.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{action.text}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ServicesPreview() {
  return (
    <section className="border-t border-gray-100">
      <div className={`${CONTAINER} py-14`}>
        <SectionIntro eyebrow="Services" title="Services and specialties" link={{ to: "/services", label: "View all services" }}>
          From routine checkups to specialist referrals, our care teams work together to support your health.
        </SectionIntro>
      </div>
    </section>
  );
}

function LocationsPreview() {
  return (
    <section className="bg-slate-50">
      <div className={`${CONTAINER} grid items-center gap-10 py-14 lg:grid-cols-2`}>
        <ImagePlaceholder className="aspect-[16/10]" />
        <SectionIntro eyebrow="Locations" title="Offices in several states" link={{ to: "/locations", label: "Find a location" }}>
          Find the clinic office nearest you, with hours and directions for each location.
        </SectionIntro>
      </div>
    </section>
  );
}

function AboutPreview() {
  return (
    <section className={`${CONTAINER} py-14`}>
      <SectionIntro eyebrow="About us" title="Who we are" link={{ to: "/about", label: "Learn about us" }}>
        Medical Clinic brings doctors, nurses, and staff together to provide coordinated care for patients in every
        community we serve.
      </SectionIntro>
    </section>
  );
}

function SectionIntro({
  eyebrow,
  title,
  link,
  children,
}: {
  eyebrow: string;
  title: string;
  link: { to: string; label: string };
  children: ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-600">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">{title}</h2>
      <p className="mt-3 text-gray-600">{children}</p>
      <Link to={link.to} className="mt-5 inline-block font-semibold text-blue-600 hover:text-blue-700">
        {link.label} →
      </Link>
    </div>
  );
}

// temporary stand-in until real photos are added
function ImagePlaceholder({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center rounded-2xl border border-navy/10 bg-linear-to-br from-navy/10 to-teal-500/10 ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-12 w-12 text-navy/30" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="10" r="1.5" />
        <path d="M21 16l-5-5-8 8" />
      </svg>
    </div>
  );
}
