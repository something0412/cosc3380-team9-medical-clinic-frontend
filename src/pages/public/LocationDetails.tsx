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

export function LocationDetailsPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const [office, setOffice] = useState<PublicOfficeDetails | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "failed">("loading");
  const [attempt, setAttempt] = useState(0);

  // return to the same filtered results when coming from the directory
  const backTo = "/locations" + ((location.state as { search?: string } | null)?.search ?? "");

  useEffect(() => {
    let active = true;

    async function loadOffice() {
      try {
        const data = await getPublicOffice(id);
        if (active) {
          setOffice(data);
          setStatus("ready");
        }
      } catch (err) {
        // 400 means a malformed ID and 404 means no active office with that ID
        const code = isAxiosError(err) ? err.response?.status : undefined;
        if (active) setStatus(code === 400 || code === 404 ? "missing" : "failed");
      }
    }

    loadOffice();
    return () => {
      active = false;
    };
  }, [id, attempt]);

  function retry() {
    setStatus("loading");
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
      <section className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl">
          {backLink}
          {status === "loading" ? (
            <p className="mt-8 text-slate-600">Loading location...</p>
          ) : (
            <div role={status === "failed" ? "alert" : undefined} className="mt-6 rounded-xl bg-white px-6 py-10 ring-1 ring-slate-200 sm:px-10">
              <h1 className="font-heading text-3xl font-semibold text-navy">
                {status === "missing" ? "We couldn't find that location" : "We couldn't load this location"}
              </h1>
              <p className="mt-3 leading-relaxed text-slate-600">
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
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className={`${CONTAINER} py-8 sm:py-10`}>
          {backLink}
          <h1 className="mt-6 font-heading text-3xl font-semibold break-words text-navy sm:text-4xl">{office.name}</h1>
          <p className="mt-1 text-lg text-slate-600">
            {office.city}, {stateName(office.state)}
          </p>

          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-12">
              <div>
                <p className="text-sm text-slate-500">Address</p>
                <OfficeAddress office={office} className="text-slate-800" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Phone</p>
                <a href={`tel:${office.phone}`} className={`rounded font-semibold text-teal-700 hover:text-navy ${FOCUS}`}>
                  {office.phone}
                </a>
              </div>
            </div>
            {office.doctors.length > 0 && (
              <Link to={`/find-a-doctor?office=${office.officeId}`} className={`${PRIMARY_BUTTON} md:shrink-0`}>
                Find doctors at this location
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className={`${CONTAINER} grid gap-10 py-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-14 lg:py-12`}>
        <div className="space-y-10">
          <section aria-labelledby="doctors-heading">
            <h2 id="doctors-heading" className="font-heading text-2xl font-semibold text-navy">
              Doctors at this location
            </h2>
            {office.doctors.length > 0 ? (
              <ul className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
                {office.doctors.map((doctor) => (
                  <li key={doctor.doctorId} className="flex items-center gap-4 px-5 py-4">
                    <DoctorAvatar firstName={doctor.firstName} lastName={doctor.lastName} className="h-11 w-11 text-sm" />
                    <div className="min-w-0">
                      <Link to={`/find-a-doctor/${doctor.doctorId}`} className={`rounded font-semibold text-navy hover:underline ${FOCUS}`}>
                        Dr. {doctor.firstName} {doctor.lastName}
                      </Link>
                      <p className="text-sm text-slate-600">Scheduled days: {formatDays(doctor.days)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5 text-slate-600">
                No doctors are currently listed for this location.
              </p>
            )}
          </section>

          <section aria-labelledby="specialties-heading">
            <h2 id="specialties-heading" className="font-heading text-2xl font-semibold text-navy">
              Specialties offered
            </h2>
            {office.specialties.length > 0 ? (
              <>
                <p className="mt-2 text-slate-600">Choose a specialty to see the doctors who practice it here.</p>
                <ul className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
                  {office.specialties.map((specialty) => (
                    <li key={specialty.specialtyId}>
                      <Link
                        to={`/find-a-doctor?specialty=${specialty.specialtyId}&office=${office.officeId}`}
                        className={`flex items-center justify-between gap-4 rounded-xl px-5 py-3.5 font-medium text-slate-800 hover:bg-slate-50 hover:text-navy ${FOCUS} focus-visible:-outline-offset-2`}
                      >
                        {specialty.name}
                        <ArrowIcon className="h-4 w-4 shrink-0 text-teal-700" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5 text-slate-600">
                No specialties are currently listed for this location.
              </p>
            )}
          </section>
        </div>

        <aside>
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-navy">About scheduled days</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Scheduled days show when each doctor regularly works at this office. They aren't a list of open appointment
              times.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
