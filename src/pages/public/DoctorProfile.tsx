import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { DoctorAvatar } from "../../components/public/DoctorAvatar";
import { ArrowIcon } from "../../components/public/icons";
import { OfficeAddress } from "../../components/public/OfficeAddress";
import { CONTAINER, FOCUS, PRIMARY_BUTTON, TEXT_LINK, usePortalLink } from "../../components/public/shared";
import { getPublicDoctor } from "../../services/publicApi";
import type { PublicDoctorDetails } from "../../services/publicApi";
import { formatDays } from "../../utils/days";

type ProfileResult = { id: string; status: "ready" | "missing" | "failed"; doctor: PublicDoctorDetails | null };

export function DoctorProfilePage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const [result, setResult] = useState<ProfileResult | null>(null);
  const [attempt, setAttempt] = useState(0);

  // a result for a different ID means the route just changed, so treat it as loading
  const current = result?.id === id ? result : null;
  const status = current?.status ?? "loading";
  const doctor = current?.doctor ?? null;

  // return to the same filtered results when coming from the directory
  const backTo = "/find-a-doctor" + ((location.state as { search?: string } | null)?.search ?? "");

  useEffect(() => {
    let active = true;

    async function loadDoctor() {
      try {
        const data = await getPublicDoctor(id);
        if (active) setResult({ id, status: "ready", doctor: data });
      } catch (err) {
        // 400 means a malformed ID and 404 means no active doctor with that ID
        const code = isAxiosError(err) ? err.response?.status : undefined;
        if (active) setResult({ id, status: code === 400 || code === 404 ? "missing" : "failed", doctor: null });
      }
    }

    loadDoctor();
    return () => {
      active = false;
    };
  }, [id, attempt]);

  function retry() {
    setResult(null);
    setAttempt((count) => count + 1);
  }

  const backLink = (
    <Link to={backTo} className={`${TEXT_LINK} text-sm`}>
      <ArrowIcon className="h-4 w-4 rotate-180" />
      Back to Find a Doctor
    </Link>
  );

  if (status !== "ready" || !doctor) {
    return (
      <section className={`${CONTAINER} pt-10 pb-20 sm:pt-14`}>
        {backLink}
        {status === "loading" ? (
          <p className="mt-8 text-slate-600">Loading doctor profile...</p>
        ) : (
          <div role={status === "failed" ? "alert" : undefined} className="mt-8 max-w-2xl">
            <h1 className="font-heading text-4xl font-semibold text-navy">
              {status === "missing" ? "We couldn't find that doctor" : "We couldn't load this profile"}
            </h1>
            <p className="mt-3 text-lg leading-relaxed text-slate-600">
              {status === "missing"
                ? "This doctor may no longer be listed. You can search the full directory instead."
                : "Please check your connection and try again."}
            </p>
            {status === "missing" ? (
              <Link to="/find-a-doctor" className={`${PRIMARY_BUTTON} mt-6`}>
                View all doctors
              </Link>
            ) : (
              <button type="button" onClick={retry} className={`${PRIMARY_BUTTON} mt-6`}>
                Try again
              </button>
            )}
          </div>
        )}
      </section>
    );
  }

  const name = `Dr. ${doctor.firstName} ${doctor.lastName}`;
  // the API lists the primary specialty first
  const [main, ...others] = doctor.specialties;

  return (
    <>
      <section className={`${CONTAINER} pt-10 sm:pt-14`}>
        {backLink}
        <div className="mt-8 flex items-center gap-5 border-b border-slate-200 pb-10 sm:gap-7">
          <DoctorAvatar firstName={doctor.firstName} lastName={doctor.lastName} className="h-16 w-16 text-xl sm:h-24 sm:w-24 sm:text-3xl" />
          <div className="min-w-0">
            <h1 className="font-heading text-4xl font-semibold text-navy sm:text-5xl">{name}</h1>
            <p className="mt-2 text-xl text-slate-700">{main ? main.name : "Specialty not listed"}</p>
            {others.length > 0 && <p className="mt-1 text-slate-500">Also practices {others.map((s) => s.name).join(", ")}</p>}
          </div>
        </div>
      </section>

      <div className={`${CONTAINER} grid gap-12 pt-10 pb-16 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] lg:gap-16 lg:pb-20`}>
        <section aria-labelledby="locations-heading">
          <h2 id="locations-heading" className="font-heading text-3xl font-semibold text-navy">
            Practice locations
          </h2>
          {doctor.offices.length > 0 ? (
            <ul className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
              {doctor.offices.map((office) => (
                <li key={office.officeId} className="grid gap-x-8 gap-y-4 py-6 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                  <div>
                    <h3 className="text-xl font-semibold text-navy">
                      <Link to={`/locations/${office.officeId}`} className={`rounded hover:underline ${FOCUS}`}>
                        {office.name}
                      </Link>
                    </h3>
                    <OfficeAddress office={office} className="mt-2 text-slate-700" />
                    <a href={`tel:${office.phone}`} className={`mt-2 inline-block rounded font-semibold text-teal-700 hover:text-navy ${FOCUS}`}>
                      {office.phone}
                    </a>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Scheduled days</p>
                    <p className="mt-1 text-lg text-slate-800">{formatDays(office.days)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 border-y border-slate-200 py-6 text-slate-600">
              {name}'s practice locations and schedule are not currently listed.
            </p>
          )}
          <Link to="/locations" className={`${TEXT_LINK} mt-6`}>
            View all clinic locations
            <ArrowIcon className="h-4 w-4" />
          </Link>
        </section>

        <aside className="space-y-8 lg:pt-1">
          <section className="border-t-2 border-teal-600 pt-5">
            <h2 className="font-semibold text-navy">About scheduled days</h2>
            <p className="mt-2 leading-relaxed text-slate-600">
              Scheduled days show when {name} regularly works at each office. They aren't a list of open appointment times.
            </p>
          </section>
          <PortalNote />
        </aside>
      </div>
    </>
  );
}

function PortalNote() {
  const portal = usePortalLink();

  // written for patients, so employees don't see it
  if (portal.isEmployee) return null;

  return (
    <section className="border-t border-slate-200 pt-5">
      <h2 className="font-semibold text-navy">Existing patients</h2>
      <p className="mt-2 leading-relaxed text-slate-600">View your appointments, medical records, and billing in the Patient Portal.</p>
      <Link to={portal.to} className={`${TEXT_LINK} mt-3`}>
        {`Go to ${portal.label}`}
        <ArrowIcon className="h-4 w-4" />
      </Link>
    </section>
  );
}
