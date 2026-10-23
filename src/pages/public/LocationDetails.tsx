import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { DoctorAvatar } from "../../components/public/DoctorAvatar";
import { ArrowIcon } from "../../components/public/icons";
import { OfficeAddress } from "../../components/public/OfficeAddress";
import { CONTAINER, FOCUS, PRIMARY_BUTTON, TEXT_LINK } from "../../components/public/shared";
import { getPublicOffice } from "../../services/publicApi";
import type { PublicOfficeDetails } from "../../services/publicApi";
import { formatDays } from "../../utils/days";
import { stateName } from "../../utils/states";

type OfficeResult = { id: string; status: "ready" | "missing" | "failed"; office: PublicOfficeDetails | null };

export function LocationDetailsPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const [result, setResult] = useState<OfficeResult | null>(null);
  const [attempt, setAttempt] = useState(0);

  // a result for a different ID means the route just changed, so treat it as loading
  const current = result?.id === id ? result : null;
  const status = current?.status ?? "loading";
  const office = current?.office ?? null;

  // return to the same filtered results when coming from the directory
  const backTo = "/locations" + ((location.state as { search?: string } | null)?.search ?? "");

  useEffect(() => {
    let active = true;

    async function loadOffice() {
      try {
        const data = await getPublicOffice(id);
        if (active) setResult({ id, status: "ready", office: data });
      } catch (err) {
        // 400 means a malformed ID and 404 means no active office with that ID
        const code = isAxiosError(err) ? err.response?.status : undefined;
        if (active) setResult({ id, status: code === 400 || code === 404 ? "missing" : "failed", office: null });
      }
    }

    loadOffice();
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
      Back to Locations
    </Link>
  );

  if (status !== "ready" || !office) {
    return (
      <section className={`${CONTAINER} pt-10 pb-20 sm:pt-14`}>
        {backLink}
        {status === "loading" ? (
          <p className="mt-8 text-slate-600">Loading location...</p>
        ) : (
          <div role={status === "failed" ? "alert" : undefined} className="mt-8 max-w-2xl">
            <h1 className="font-heading text-4xl font-semibold text-navy">
              {status === "missing" ? "We couldn't find that location" : "We couldn't load this location"}
            </h1>
            <p className="mt-3 text-lg leading-relaxed text-slate-600">
              {status === "missing"
                ? "This location may no longer be listed. You can browse all of our locations instead."
                : "Please check your connection and try again."}
            </p>
            {status === "missing" ? (
              <Link to="/locations" className={`${PRIMARY_BUTTON} mt-6`}>
                View all locations
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

  return (
    <>
      <section className={`${CONTAINER} pt-10 sm:pt-14`}>
        {backLink}
        <h1 className="mt-8 font-heading text-4xl font-semibold break-words text-navy sm:text-5xl">{office.name}</h1>
        <p className="mt-2 text-xl text-slate-600">
          {office.city}, {stateName(office.state)}
        </p>

        <div className="mt-8 flex flex-col gap-6 border-b border-slate-200 pb-10 md:flex-row md:items-end md:justify-between">
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-16">
            <div>
              <p className="text-sm text-slate-500">Address</p>
              <OfficeAddress office={office} className="mt-1 text-lg text-slate-800" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Phone</p>
              <a href={`tel:${office.phone}`} className={`mt-1 inline-block rounded text-lg font-semibold text-teal-700 hover:text-navy ${FOCUS}`}>
                {office.phone}
              </a>
            </div>
          </div>
          {office.doctors.length > 0 && (
            <Link to={`/find-a-doctor?office=${office.officeId}`} className={`${PRIMARY_BUTTON} self-start md:self-auto md:shrink-0`}>
              Find doctors at this location
            </Link>
          )}
        </div>
      </section>

      <div className={`${CONTAINER} grid gap-12 pt-10 pb-16 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] lg:gap-16 lg:pb-20`}>
        <div className="space-y-12">
          <section aria-labelledby="doctors-heading">
            <h2 id="doctors-heading" className="font-heading text-3xl font-semibold text-navy">
              Doctors at this location
            </h2>
            {office.doctors.length > 0 ? (
              <ul className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
                {office.doctors.map((doctor) => (
                  <li key={doctor.doctorId} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-4">
                    <DoctorAvatar firstName={doctor.firstName} lastName={doctor.lastName} className="h-10 w-10 text-sm" />
                    <Link to={`/find-a-doctor/${doctor.doctorId}`} className={`mr-auto rounded text-lg font-semibold text-navy hover:underline ${FOCUS}`}>
                      Dr. {doctor.firstName} {doctor.lastName}
                    </Link>
                    <p className="w-full pl-14 text-slate-600 sm:w-auto sm:pl-0">Scheduled days: {formatDays(doctor.days)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 border-y border-slate-200 py-6 text-slate-600">No doctors are currently listed for this location.</p>
            )}
          </section>

          <section aria-labelledby="specialties-heading">
            <h2 id="specialties-heading" className="font-heading text-3xl font-semibold text-navy">
              Specialties offered
            </h2>
            {office.specialties.length > 0 ? (
              <>
                <p className="mt-2 text-slate-600">Choose a specialty to see the doctors who practice it here.</p>
                <ul className="mt-5 grid gap-x-10 border-b border-slate-200 sm:grid-cols-2">
                  {office.specialties.map((specialty) => (
                    <li key={specialty.specialtyId} className="border-t border-slate-200">
                      <Link
                        to={`/find-a-doctor?specialty=${specialty.specialtyId}&office=${office.officeId}`}
                        className={`group flex items-center justify-between gap-4 rounded py-3.5 font-semibold text-navy hover:text-teal-700 ${FOCUS}`}
                      >
                        {specialty.name}
                        <ArrowIcon className="h-4 w-4 shrink-0 text-teal-700 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-5 border-y border-slate-200 py-6 text-slate-600">No specialties are currently listed for this location.</p>
            )}
          </section>
        </div>

        <aside className="lg:pt-1">
          <section className="border-t-2 border-teal-600 pt-5">
            <h2 className="font-semibold text-navy">About scheduled days</h2>
            <p className="mt-2 leading-relaxed text-slate-600">
              Scheduled days show when each doctor regularly works at this office. They aren't a list of open appointment times.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
