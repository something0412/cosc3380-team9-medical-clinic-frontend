import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowIcon } from "../../components/public/icons";
import { CONTAINER, FOCUS, PRIMARY_BUTTON, SECONDARY_BUTTON, SECTION_HEADING, usePortalLink } from "../../components/public/shared";
import { getPublicSpecialties } from "../../services/publicApi";
import type { PublicSpecialty } from "../../services/publicApi";
import { specialtyDescription } from "../../utils/specialties";
import hero900 from "../../assets/images/home/hero-consultation-900.webp";
import hero1600 from "../../assets/images/home/hero-consultation-1600.webp";
import waitingRoom800 from "../../assets/images/home/locations-waiting-room-800.webp";
import waitingRoom1200 from "../../assets/images/home/locations-waiting-room-1200.webp";

// what visitors can do on the Locations pages
const LOCATION_FEATURES = [
  {
    title: "Addresses and phone numbers",
    text: "Search by office name, city, state, or ZIP code to find the location that works for you.",
  },
  {
    title: "Doctors at each location",
    text: "See which doctors practice at an office, the days they're scheduled there, and the specialties offered.",
  },
];

export function HomePage() {
  return (
    <>
      <Hero />
      <PortalNotice />
      <ServicesPreview />
      <LocationsPreview />
      <AboutPreview />
    </>
  );
}

function Hero() {
  return (
    <section className="bg-slate-50">
      <div className={`${CONTAINER} grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:py-20`}>
        <div className="max-w-xl">
          <h1 className="font-heading text-[2.25rem] font-semibold leading-[1.1] text-balance text-navy sm:text-5xl">
            Your primary care doctor and specialists, working together
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            See one of our family or internal medicine physicians for checkups and everyday health concerns, or a
            specialist for ongoing care. Start by finding a doctor or a clinic location.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/find-a-doctor" className={PRIMARY_BUTTON}>
              Find a Doctor
            </Link>
            <Link to="/locations" className={SECONDARY_BUTTON}>
              Locations
            </Link>
          </div>
        </div>

        <img
          src={hero1600}
          srcSet={`${hero900} 900w, ${hero1600} 1600w`}
          sizes="(min-width: 1024px) 50vw, 100vw"
          width={1600}
          height={1067}
          fetchPriority="high"
          alt="A doctor listening to a patient during an appointment"
          className="aspect-[3/2] w-full rounded-xl object-cover object-[40%_50%] lg:aspect-[4/3]"
        />
      </div>
    </section>
  );
}

function PortalNotice() {
  const portal = usePortalLink();

  // this note is written for patients
  if (portal.isEmployee) return null;

  return (
    <section aria-label="Patient Portal" className="border-y border-slate-200 bg-white">
      <div className={`${CONTAINER} flex flex-col gap-3 py-6 md:flex-row md:items-center md:justify-between md:gap-8`}>
        <p className="leading-relaxed text-slate-600">
          <span className="font-semibold text-navy">Already a patient?</span> View your appointments, medical records,
          forms, and billing in the Patient Portal.
        </p>
        <TextLink to={portal.to}>{`Go to ${portal.label}`}</TextLink>
      </div>
    </section>
  );
}

const PREVIEW_COUNT = 4;

function ServicesPreview() {
  const [specialties, setSpecialties] = useState<PublicSpecialty[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSpecialties() {
      try {
        const data = await getPublicSpecialties();
        if (active) setSpecialties(data);
      } catch {
        if (active) setFailed(true);
      }
    }

    loadSpecialties();
    return () => {
      active = false;
    };
  }, []);

  // specialties with doctors first, starting with the ones that don't need a referral
  const ordered = [...(specialties ?? [])].sort(
    (a, b) =>
      Number(b.doctorCount > 0) - Number(a.doctorCount > 0) ||
      Number(a.requiresReferral) - Number(b.requiresReferral) ||
      a.name.localeCompare(b.name)
  );
  const preview = ordered.slice(0, PREVIEW_COUNT);
  const others = ordered.slice(PREVIEW_COUNT).map((s) => s.name).sort((a, b) => a.localeCompare(b));

  return (
    <section className="py-16 lg:py-20">
      <div className={`${CONTAINER} grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16`}>
        <div className="max-w-xl">
          <h2 className={`${SECTION_HEADING} text-navy`}>From checkups to specialist care</h2>
          <p className="mt-4 leading-relaxed text-slate-600">
            Your primary care doctor is the first stop for most health needs. If you need more specialized care, they can
            refer you to one of our specialists.
          </p>
          <div className="mt-6">
            <TextLink to="/services">View all services</TextLink>
          </div>
        </div>

        {failed || specialties?.length === 0 ? (
          <div className="self-start border-t border-slate-200 pt-5">
            <p className="leading-relaxed text-slate-600">
              Our doctors provide primary care and a range of specialty care. See our Services page for the areas of care we
              currently offer.
            </p>
          </div>
        ) : specialties === null ? (
          // placeholders the same shape as the list, so the page doesn't jump when data arrives
          <div aria-busy="true">
            <p className="sr-only">Loading services</p>
            <ul aria-hidden="true" className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {Array.from({ length: PREVIEW_COUNT }, (_, i) => (
                <li key={i} className="border-t border-slate-200 pt-5">
                  <div className="h-5 w-2/5 rounded bg-slate-100" />
                  <div className="mt-3 h-3.5 w-full rounded bg-slate-100" />
                  <div className="mt-2 h-3.5 w-full rounded bg-slate-100" />
                  <div className="mt-2 h-3.5 w-3/5 rounded bg-slate-100" />
                </li>
              ))}
            </ul>
            <div aria-hidden="true" className="mt-8 border-t border-slate-200 pt-5">
              <div className="h-3.5 w-3/4 rounded bg-slate-100" />
            </div>
          </div>
        ) : (
          <div>
            <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {preview.map((specialty) => (
                <li key={specialty.specialtyId} className="border-t border-slate-200 pt-5">
                  <h3 className="font-semibold break-words text-navy">
                    {specialty.doctorCount > 0 ? (
                      <Link to={`/find-a-doctor?specialty=${specialty.specialtyId}`} className={`rounded hover:underline ${FOCUS}`}>
                        {specialty.name}
                      </Link>
                    ) : (
                      specialty.name
                    )}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{specialtyDescription(specialty.name)}</p>
                </li>
              ))}
            </ul>
            {others.length > 0 && (
              <p className="mt-8 border-t border-slate-200 pt-5 text-sm text-slate-600">
                Other areas of care: {new Intl.ListFormat("en", { type: "conjunction" }).format(others)}.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function LocationsPreview() {
  return (
    <section className="bg-navy text-white">
      <div className={`${CONTAINER} grid items-center gap-10 py-16 lg:grid-cols-2 lg:gap-16 lg:py-20`}>
        <img
          src={waitingRoom1200}
          srcSet={`${waitingRoom800} 800w, ${waitingRoom1200} 1200w`}
          sizes="(min-width: 1024px) 50vw, 100vw"
          width={1200}
          height={800}
          loading="lazy"
          decoding="async"
          alt="A bright clinic waiting room with seating and a reception desk"
          className="aspect-video w-full rounded-xl object-cover lg:aspect-[4/3]"
        />
        <div>
          <h2 className={SECTION_HEADING}>Find a clinic location</h2>
          <p className="mt-4 text-lg leading-relaxed text-white/80">
            Explore our clinic locations and find the office that works best for you.
          </p>

          <ul className="mt-8 grid gap-6 sm:grid-cols-2">
            {LOCATION_FEATURES.map((feature) => (
              <li key={feature.title} className="border-t border-white/20 pt-4">
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-white/75">{feature.text}</p>
              </li>
            ))}
          </ul>

          <Link
            to="/locations"
            className="mt-10 inline-flex items-center justify-center rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Explore Locations
          </Link>
        </div>
      </div>
    </section>
  );
}

function AboutPreview() {
  return (
    <section className="py-16 lg:py-20">
      <div className={`${CONTAINER} grid gap-6 lg:grid-cols-[1fr_1.25fr] lg:gap-16`}>
        <h2 className={`${SECTION_HEADING} text-navy`}>Care that stays connected</h2>
        <div>
          <p className="text-lg leading-relaxed text-slate-600">
            We're a team of physicians, nurses, and front-desk staff. Your primary care doctor and any
            specialist you see work from the same patient record, so each visit picks up where the last one left off.
          </p>
          <div className="mt-6">
            <TextLink to="/about">Learn about us</TextLink>
          </div>
        </div>
      </div>
    </section>
  );
}

function TextLink({ to, children }: { to: string; children: string }) {
  return (
    <Link
      to={to}
      className="group inline-flex shrink-0 items-center gap-1.5 rounded font-semibold text-teal-700 hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
    >
      {children}
      <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
