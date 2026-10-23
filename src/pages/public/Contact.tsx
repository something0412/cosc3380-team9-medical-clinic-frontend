import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowIcon } from "../../components/public/icons";
import { OfficeAddress } from "../../components/public/OfficeAddress";
import { CONTAINER, FOCUS, SECONDARY_BUTTON, TEXT_LINK, usePortalLink } from "../../components/public/shared";
import { getPublicOffices } from "../../services/publicApi";
import type { PublicOffice } from "../../services/publicApi";
import { stateName } from "../../utils/states";

export function ContactPage() {
  const [offices, setOffices] = useState<PublicOffice[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const portal = usePortalLink();

  useEffect(() => {
    let active = true;

    async function loadOffices() {
      try {
        const data = await getPublicOffices();
        if (active) {
          setOffices(data);
          setFailed(false);
        }
      } catch {
        if (active) setFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOffices();
    return () => {
      active = false;
    };
  }, [attempt]);

  function retry() {
    setLoading(true);
    setAttempt((count) => count + 1);
  }

  // offices grouped by state, then sorted by city and name
  const states = [...new Set(offices.map((o) => o.state.toUpperCase()))].sort((a, b) => stateName(a).localeCompare(stateName(b)));
  const officesIn = (state: string) =>
    offices
      .filter((o) => o.state.toUpperCase() === state)
      .sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));

  return (
    <>
      <section className={`${CONTAINER} pt-10 sm:pt-14`}>
        <h1 className="font-heading text-4xl font-semibold text-navy sm:text-5xl">Contact Us</h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-600">
          Find the address and phone number for each of our clinic offices below.
        </p>
      </section>

      <div className={`${CONTAINER} grid gap-12 pt-12 pb-16 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] lg:gap-16 lg:pb-20`}>
        <section aria-labelledby="offices-heading">
          <h2 id="offices-heading" className="sr-only">
            Clinic offices
          </h2>

          {loading ? (
            <p className="border-t border-slate-200 py-8 text-slate-600">Loading offices...</p>
          ) : failed ? (
            <div role="alert" className="border-t border-slate-200 py-8">
              <p className="font-semibold text-navy">We couldn't load our office contact information.</p>
              <p className="mt-1 text-slate-600">Please check your connection and try again.</p>
              <button type="button" onClick={retry} className={`${SECONDARY_BUTTON} mt-4`}>
                Try again
              </button>
            </div>
          ) : offices.length === 0 ? (
            <p className="border-t border-slate-200 py-8 text-slate-600">No offices are listed right now. Please check back later.</p>
          ) : (
            <div className="space-y-10">
              {states.map((state) => (
                <section key={state} aria-labelledby={`contact-${state}`}>
                  <h3 id={`contact-${state}`} className="font-heading text-2xl font-semibold text-navy">
                    {stateName(state)}
                  </h3>
                  <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
                    {officesIn(state).map((office) => (
                      <li
                        key={office.officeId}
                        className="grid gap-x-8 gap-y-2 py-5 sm:grid-cols-2 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.1fr)_auto] md:items-center"
                      >
                        <div className="min-w-0">
                          <h4 className="text-xl font-semibold break-words text-navy">{office.name}</h4>
                          <p className="mt-0.5 text-slate-600">
                            {office.city}, {stateName(office.state)}
                          </p>
                        </div>
                        <OfficeAddress office={office} className="text-slate-700" />
                        <div className="flex flex-col items-start gap-1 md:items-end">
                          <a href={`tel:${office.phone}`} className={`rounded font-semibold text-teal-700 hover:text-navy ${FOCUS}`}>
                            {office.phone}
                          </a>
                          <Link to={`/locations/${office.officeId}`} aria-label={`View location, ${office.name}`} className={`${TEXT_LINK} text-sm`}>
                            View location
                            <ArrowIcon className="h-4 w-4" />
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          <Link to="/locations" className={`${TEXT_LINK} mt-8`}>
            Explore all locations
            <ArrowIcon className="h-4 w-4" />
          </Link>
        </section>

        <aside className="space-y-8 lg:pt-1">
          {!portal.isEmployee && (
            <section className="border-t-2 border-teal-600 pt-5">
              <h2 className="font-semibold text-navy">Already a patient?</h2>
              <p className="mt-2 leading-relaxed text-slate-600">
                Use the Patient Portal to view your appointments, medical records, forms, and billing.
              </p>
              <Link to={portal.to} className={`${TEXT_LINK} mt-3`}>
                {`Go to ${portal.label}`}
                <ArrowIcon className="h-4 w-4" />
              </Link>
            </section>
          )}
          <section className="border-t border-slate-200 pt-5">
            <h2 className="font-semibold text-navy">Medical emergencies</h2>
            <p className="mt-2 leading-relaxed text-slate-600">
              If you think you are having a medical emergency, call 911 or go to the nearest emergency room.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
