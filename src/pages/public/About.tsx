import { Link } from "react-router-dom";
import { ArrowIcon } from "../../components/public/icons";
import { CONTAINER, FOCUS, SECTION_HEADING, usePortalLink } from "../../components/public/shared";

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
    title: "Your Patient Portal",
    text: "Patients can sign in to the Patient Portal to view their appointments, records, forms, and billing.",
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
      <section className={`${CONTAINER} pt-10 pb-14 sm:pt-14 lg:pb-16`}>
        <h1 className="font-heading text-4xl font-semibold text-navy sm:text-5xl">About Medical Clinic</h1>
        <p className="mt-5 max-w-3xl text-xl leading-relaxed text-slate-600">
          Medical Clinic is a group of clinic offices where patients see primary care doctors and specialists. Our
          physicians, nurses, and front-desk staff work as one team across our locations.
        </p>
      </section>

      <section aria-labelledby="care-heading" className={`${CONTAINER} pb-16 lg:pb-20`}>
        <div className="grid gap-10 border-t border-slate-200 pt-12 lg:grid-cols-[1fr_1.6fr] lg:gap-16 lg:pt-14">
          <div className="max-w-xl">
            <h2 id="care-heading" className={`${SECTION_HEADING} text-navy`}>
              How care works here
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Most care starts with a primary care doctor who knows your history. From there, you can reach the right
              specialist and office.
            </p>
          </div>
          <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {CARE_POINTS.map((point) => (
              <li key={point.title} className="border-t border-slate-200 pt-5">
                <h3 className="text-lg font-semibold text-navy">{point.title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{point.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="find-care-heading" className="border-t border-slate-200 bg-slate-50 py-16 lg:py-20">
        <div className={`${CONTAINER} grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16`}>
          <div className="max-w-xl">
            <h2 id="find-care-heading" className={`${SECTION_HEADING} text-navy`}>
              Find care that fits your needs
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Start with a doctor, an area of care, or the office that fits your routine.
            </p>
          </div>
          <ul className="divide-y divide-slate-200 border-y border-slate-200">
            {links.map((link) => (
              <li key={link.title}>
                <Link
                  to={link.to}
                  className={`group flex items-center justify-between gap-4 rounded py-5 ${FOCUS} focus-visible:-outline-offset-2`}
                >
                  <span>
                    <span className="block text-lg font-semibold text-navy group-hover:text-teal-700">{link.title}</span>
                    <span className="mt-0.5 block leading-relaxed text-slate-600">{link.text}</span>
                  </span>
                  <ArrowIcon className="h-5 w-5 shrink-0 text-teal-700 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
