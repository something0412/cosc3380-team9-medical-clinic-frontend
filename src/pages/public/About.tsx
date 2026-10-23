import { Link } from "react-router-dom";
import { ArrowIcon } from "../../components/public/icons";
import { CONTAINER, FOCUS, SECTION_HEADING, usePortalLink } from "../../components/public/shared";
import familyVisit800 from "../../assets/images/about/family-visit-800.webp";
import familyVisit1200 from "../../assets/images/about/family-visit-1200.webp";

const CARE_POINTS = [
  {
    title: "Primary care comes first",
    text: "Family medicine and internal medicine doctors handle checkups, everyday health concerns, and ongoing conditions. For most health needs, they're the place to start.",
  },
  {
    title: "Specialists when you need them",
    text: "When you need more focused care, you can see one of our specialists. Some specialties require a referral from your primary care doctor first.",
  },
  {
    title: "Doctors across our offices",
    text: "Each doctor works at one or more of our clinic offices on scheduled days. A doctor's profile shows where and when they practice.",
  },
  {
    title: "One record and one portal",
    text: "Your doctors and nurses work from the same patient record. Patients can sign in to the Patient Portal to view appointments, records, forms, and billing.",
  },
];

export function AboutPage() {
  const portal = usePortalLink();

  const links = [
    { to: "/find-a-doctor", title: "Find a Doctor", text: "Search our physicians by name, specialty, or location." },
    { to: "/services", title: "Our Services", text: "See our areas of care and which ones need a referral." },
    { to: "/locations", title: "Locations", text: "Find an office's address, phone number, and the doctors who practice there." },
  ];
  // the portal link is written for patients, so employees don't see it
  if (!portal.isEmployee) {
    links.push({ to: portal.to, title: portal.label, text: "Existing patients can view appointments, records, forms, and billing." });
  }

  return (
    <>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className={`${CONTAINER} py-10 sm:py-12`}>
          <h1 className="font-heading text-4xl font-semibold text-navy sm:text-5xl">About Medical Clinic</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
            Medical Clinic is a group of clinic offices where patients see primary care doctors and specialists. Our
            physicians, nurses, and front-desk staff work together, so your care stays connected from one visit to the next.
          </p>
        </div>
      </section>

      <div className={`${CONTAINER} pt-10 lg:pt-14`}>
        <img
          src={familyVisit1200}
          srcSet={`${familyVisit800} 800w, ${familyVisit1200} 1200w`}
          sizes="(min-width: 1280px) 1200px, 100vw"
          width={1200}
          height={675}
          alt="A doctor talking with an older man and a young boy during a visit"
          className="aspect-video w-full rounded-xl object-cover lg:aspect-[21/9]"
        />
      </div>

      <section aria-labelledby="care-heading" className="py-14 lg:py-20">
        <div className={`${CONTAINER} grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16`}>
          <div className="max-w-xl">
            <h2 id="care-heading" className={`${SECTION_HEADING} text-navy`}>
              How care works here
            </h2>
            <p className="mt-4 leading-relaxed text-slate-600">
              Most care starts with a primary care doctor who knows your history. From there, we help you reach the right
              specialist and office.
            </p>
          </div>
          <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {CARE_POINTS.map((point) => (
              <li key={point.title} className="border-t border-slate-200 pt-5">
                <h3 className="font-semibold text-navy">{point.title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{point.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="find-care-heading" className="border-t border-slate-200 bg-slate-50 py-14 lg:py-20">
        <div className={`${CONTAINER} grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16`}>
          <div className="max-w-xl">
            <h2 id="find-care-heading" className={`${SECTION_HEADING} text-navy`}>
              Find care that fits your needs
            </h2>
            <p className="mt-4 leading-relaxed text-slate-600">
              Start with a doctor, an area of care, or the office that fits your routine.
            </p>
          </div>
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {links.map((link) => (
              <li key={link.title}>
                <Link
                  to={link.to}
                  className={`group flex items-center justify-between gap-4 rounded-xl px-5 py-4 hover:bg-slate-50 ${FOCUS} focus-visible:-outline-offset-2`}
                >
                  <span>
                    <span className="block font-semibold text-navy">{link.title}</span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-slate-600">{link.text}</span>
                  </span>
                  <ArrowIcon className="h-4 w-4 shrink-0 text-teal-700 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
