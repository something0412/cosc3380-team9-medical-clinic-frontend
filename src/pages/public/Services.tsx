import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowIcon } from "../../components/public/icons";
import { CONTAINER, PRIMARY_BUTTON, SECONDARY_BUTTON, TEXT_LINK } from "../../components/public/shared";
import { getPublicSpecialties } from "../../services/publicApi";
import type { PublicSpecialty } from "../../services/publicApi";
import { specialtyDescription } from "../../utils/specialties";

export function ServicesPage() {
  const [specialties, setSpecialties] = useState<PublicSpecialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadSpecialties() {
      try {
        const data = await getPublicSpecialties();
        if (active) {
          setSpecialties(data);
          setFailed(false);
        }
      } catch {
        if (active) setFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSpecialties();
    return () => {
      active = false;
    };
  }, [attempt]);

  function retry() {
    setLoading(true);
    setAttempt((count) => count + 1);
  }

  // grouped by the referral setting stored for each specialty
  const direct = specialties.filter((s) => !s.requiresReferral);
  const referral = specialties.filter((s) => s.requiresReferral);

  return (
    <>
      <section className={`${CONTAINER} pt-10 sm:pt-14`}>
        <h1 className="font-heading text-4xl font-semibold text-navy sm:text-5xl">Our Services</h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-600">
          Explore our areas of care and find a doctor who practices in each one.
        </p>
      </section>

      <div className={`${CONTAINER} pt-12 pb-16 lg:pb-20`}>
        {loading ? (
          <p className="border-t border-slate-200 py-8 text-slate-600">Loading services...</p>
        ) : failed ? (
          <div role="alert" className="border-t border-slate-200 py-8">
            <p className="font-semibold text-navy">We couldn't load our services.</p>
            <p className="mt-1 text-slate-600">Please check your connection and try again.</p>
            <button type="button" onClick={retry} className={`${SECONDARY_BUTTON} mt-4`}>
              Try again
            </button>
          </div>
        ) : specialties.length === 0 ? (
          <p className="border-t border-slate-200 py-8 text-slate-600">No services are listed right now. Please check back later.</p>
        ) : (
          <div className="space-y-16">
            {direct.length > 0 && (
              <SpecialtyGroup
                id="no-referral-heading"
                title="No referral required"
                description="You can see doctors in these areas of care without a referral."
                specialties={direct}
              />
            )}
            {referral.length > 0 && (
              <SpecialtyGroup
                id="referral-heading"
                title="Referral required"
                description="These specialties need a referral from your primary care doctor before you schedule an appointment."
                specialties={referral}
              />
            )}
          </div>
        )}
      </div>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className={`${CONTAINER} flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between lg:py-12`}>
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl font-semibold text-navy">Not sure where to start?</h2>
            <p className="mt-2 leading-relaxed text-slate-600">
              A primary care doctor can help with most health concerns and refer you to a specialist when you need one.
            </p>
          </div>
          <Link to="/find-a-doctor" className={`${PRIMARY_BUTTON} md:shrink-0`}>
            Find a Doctor
          </Link>
        </div>
      </section>
    </>
  );
}

function SpecialtyGroup({ id, title, description, specialties }: { id: string; title: string; description: string; specialties: PublicSpecialty[] }) {
  return (
    <section aria-labelledby={id}>
      <div className="max-w-2xl">
        <h2 id={id} className="font-heading text-3xl font-semibold text-navy">
          {title}
        </h2>
        <p className="mt-2 text-lg leading-relaxed text-slate-600">{description}</p>
      </div>

      <ul className="mt-6 grid gap-x-12 border-b border-slate-200 md:grid-cols-2">
        {specialties.map((specialty) => (
          <li key={specialty.specialtyId} className="border-t border-slate-200 py-6">
            <h3 className="text-xl font-semibold break-words text-navy">{specialty.name}</h3>
            <p className="mt-2 leading-relaxed text-slate-600">{specialtyDescription(specialty.name)}</p>
            {specialty.doctorCount > 0 ? (
              <Link
                to={`/find-a-doctor?specialty=${specialty.specialtyId}`}
                aria-label={`Find doctors for ${specialty.name}`}
                className={`${TEXT_LINK} mt-3 text-sm`}
              >
                Find doctors
                <ArrowIcon className="h-4 w-4" />
              </Link>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No doctors currently listed</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
