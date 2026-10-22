import { Link } from "react-router-dom";
import { Icon } from "../../components/public/icons";
import type { IconName } from "../../components/public/icons";
import { CONTAINER, EYEBROW, PRIMARY_BUTTON, SECONDARY_BUTTON, usePortalLink } from "../../components/public/shared";
import hero900 from "../../assets/images/home/hero-consultation-900.webp";
import hero1600 from "../../assets/images/home/hero-consultation-1600.webp";
import waitingRoom800 from "../../assets/images/home/locations-waiting-room-800.webp";
import waitingRoom1200 from "../../assets/images/home/locations-waiting-room-1200.webp";

const SERVICES: { icon: IconName; name: string; text: string }[] = [
  {
    icon: "stethoscope",
    name: "Primary Care",
    text: "Checkups, preventive screenings, and care for everyday health concerns.",
  },
  {
    icon: "heart",
    name: "Cardiology",
    text: "Diagnosis and ongoing care for heart conditions, blood pressure, and cholesterol.",
  },
  {
    icon: "pulse",
    name: "Neurology",
    text: "Care for conditions of the brain, spine, and nerves, such as headaches and seizures.",
  },
  {
    icon: "drop",
    name: "Dermatology",
    text: "Treatment for skin, hair, and nail conditions, plus routine skin cancer screenings.",
  },
];

const VALUES: { icon: IconName; title: string; text: string }[] = [
  { icon: "people", title: "Patient-centered", text: "Care plans built around your needs and goals." },
  { icon: "pin", title: "Accessible", text: "Offices in several states and online access to your care." },
  { icon: "link", title: "Coordinated", text: "Primary and specialty doctors working as one team." },
];

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
  const portal = usePortalLink();

  return (
    <section className="bg-slate-50">
      <div className={`${CONTAINER} grid items-center gap-10 pb-24 pt-10 sm:pt-14 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:pb-32 lg:pt-16`}>
        <div className="max-w-xl">
          <p className={EYEBROW}>Welcome to Medical Clinic</p>
          <h1 className="mt-4 text-balance text-[2.1rem] font-bold leading-[1.12] tracking-tight text-navy sm:text-[2.6rem] xl:text-5xl">
            Trusted care for every stage of life
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            Our primary care physicians and specialists work together across offices in several states, so your care stays
            connected wherever you are.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to={portal.appointmentsTo} className={PRIMARY_BUTTON}>
              <Icon name="calendar" className="h-5 w-5" />
              Book Appointment
            </Link>
            <Link to="/find-a-doctor" className={SECONDARY_BUTTON}>
              <Icon name="doctor" className="h-5 w-5" />
              Find a Doctor
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Online booking is coming soon. Patients can view their appointments in the Patient Portal.
          </p>
        </div>

        <div className="relative">
          <div aria-hidden="true" className="absolute -bottom-5 -left-5 hidden h-2/3 w-2/3 rounded-3xl bg-teal-100/70 lg:block" />
          <img
            src={hero1600}
            srcSet={`${hero900} 900w, ${hero1600} 1600w`}
            sizes="(min-width: 1024px) 50vw, 100vw"
            width={1600}
            height={1067}
            fetchPriority="high"
            alt="A doctor listening to a patient during an appointment"
            className="relative aspect-[3/2] w-full rounded-2xl object-cover object-[40%_50%] shadow-xl ring-1 ring-slate-900/5 lg:aspect-[4/3]"
          />
        </div>
      </div>
    </section>
  );
}

function QuickActions() {
  const portal = usePortalLink();
  const actions: { icon: IconName; title: string; text: string; to: string }[] = [
    { icon: "calendar", title: "Appointments", text: "View your upcoming and past visits in the Patient Portal.", to: portal.appointmentsTo },
    { icon: "doctor", title: "Find a Doctor", text: "Browse our physicians by specialty and location.", to: "/find-a-doctor" },
    { icon: "pin", title: "Locations", text: "Find a Medical Clinic office near you.", to: "/locations" },
  ];

  return (
    <section aria-label="Quick actions" className={`${CONTAINER} relative z-10 -mt-14 lg:-mt-20`}>
      <ul className="grid divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-900/5 md:grid-cols-3 md:divide-x md:divide-y-0">
        {actions.map((action) => (
          <li key={action.title}>
            <Link
              to={action.to}
              className="group flex h-full items-start gap-4 p-6 transition-colors md:flex-col lg:flex-row hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600 lg:p-7"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition-colors group-hover:bg-teal-100">
                <Icon name={action.icon} />
              </span>
              <span className="w-full flex-1">
                <span className="flex items-center justify-between gap-2 font-semibold text-navy">
                  {action.title}
                  <Icon name="arrow" className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-slate-600">{action.text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ServicesPreview() {
  return (
    <section className="py-20 lg:py-24">
      <div className={CONTAINER}>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className={EYEBROW}>Our services</p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-navy lg:text-4xl">Primary and specialty care in one place</h2>
            <p className="mt-4 leading-relaxed text-slate-600">
              Start with a primary care physician who knows your history. When you need a specialist, your doctor's referral
              connects you with our team.
            </p>
          </div>
          <TextLink to="/services">View all services</TextLink>
        </div>

        <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
          {SERVICES.map((service) => (
            <li key={service.name} className="bg-white p-7">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Icon name={service.icon} />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-navy">{service.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{service.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function LocationsPreview() {
  const points = [
    "Primary and specialty care at our offices",
    "Your records available at every location",
    "Referrals coordinated with your primary physician",
  ];

  return (
    <section className="bg-navy text-white">
      <div className={`${CONTAINER} grid items-center gap-12 py-20 lg:grid-cols-2 lg:gap-16 lg:py-24`}>
        <img
          src={waitingRoom1200}
          srcSet={`${waitingRoom800} 800w, ${waitingRoom1200} 1200w`}
          sizes="(min-width: 1024px) 50vw, 100vw"
          width={1200}
          height={800}
          loading="lazy"
          decoding="async"
          alt="A bright clinic waiting room with seating and a reception desk"
          className="aspect-video w-full rounded-2xl object-cover shadow-2xl ring-1 ring-white/10 lg:aspect-[3/2]"
        />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-300">Locations</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight lg:text-4xl">Connected care across multiple states</h2>
          <p className="mt-4 text-lg leading-relaxed text-white/80">
            Every Medical Clinic office shares one patient record and one Patient Portal, so your care stays coordinated no
            matter which location you visit.
          </p>
          <ul className="mt-8 space-y-3">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-white/90">
                <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-teal-300" />
                {point}
              </li>
            ))}
          </ul>
          <Link
            to="/locations"
            className="mt-10 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-navy shadow-sm transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            View Locations
            <Icon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function AboutPreview() {
  return (
    <section className="py-20 lg:py-24">
      <div className={`${CONTAINER} grid gap-12 xl:grid-cols-[1fr_1.25fr] xl:items-center xl:gap-16`}>
        <div>
          <p className={EYEBROW}>About us</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-navy lg:text-4xl">Patient centered care, made accessible</h2>
          <p className="mt-4 leading-relaxed text-slate-600">
            Medical Clinic is a group of physicians, nurses, and staff dedicated to making quality healthcare easier to reach.
            We listen first, explain clearly, and work as one team for every patient.
          </p>
          <div className="mt-6">
            <TextLink to="/about">Learn about us</TextLink>
          </div>
        </div>

        <ul className="grid gap-8 sm:grid-cols-3 sm:gap-6">
          {VALUES.map((value) => (
            <li key={value.title} className="border-t-2 border-teal-500 pt-5">
              <Icon name={value.icon} className="h-6 w-6 text-teal-600" />
              <h3 className="mt-3 font-semibold text-navy">{value.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{value.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function TextLink({ to, children }: { to: string; children: string }) {
  return (
    <Link
      to={to}
      className="group inline-flex shrink-0 items-center gap-1.5 rounded font-semibold text-blue-600 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      {children}
      <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
