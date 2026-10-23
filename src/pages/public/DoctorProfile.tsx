import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { DoctorAvatar } from "../../components/public/DoctorAvatar";
import { ArrowIcon } from "../../components/public/icons";
import { CONTAINER, FOCUS, PRIMARY_BUTTON, SECONDARY_BUTTON, usePortalLink } from "../../components/public/shared";
import { getPublicDoctor } from "../../services/publicApi";
import type { PublicDoctorDetails } from "../../services/publicApi";

const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// days in calendar order, with a full work week shortened
function formatDays(days: string[]) {
  const ordered = WEEK.filter((day) => days.includes(day));
  if (ordered.join() === WEEK.slice(0, 5).join()) return "Monday–Friday";
  return ordered.join(", ");
}

const TEXT_LINK = `inline-flex items-center gap-1.5 rounded font-semibold text-teal-700 hover:text-navy ${FOCUS}`;

export function DoctorProfilePage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const [doctor, setDoctor] = useState<PublicDoctorDetails | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "failed">("loading");
  const [attempt, setAttempt] = useState(0);

  // return to the same filtered results when coming from the directory
  const backTo = "/find-a-doctor" + ((location.state as { search?: string } | null)?.search ?? "");

  useEffect(() => {
    let active = true;

    async function loadDoctor() {
      try {
        const data = await getPublicDoctor(id);
        if (active) {
          setDoctor(data);
          setStatus("ready");
        }
      } catch (err) {
        // 400 means a malformed ID and 404 means no active doctor with that ID
        const code = isAxiosError(err) ? err.response?.status : undefined;
        if (active) setStatus(code === 400 || code === 404 ? "missing" : "failed");
      }
    }

    loadDoctor();
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
      Back to Find a Doctor
    </Link>
  );

  if (status !== "ready" || !doctor) {
    return (
      <section className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl">
          {backLink}
          {status === "loading" ? (
            <p className="mt-8 text-slate-600">Loading doctor profile...</p>
          ) : (
            <div role={status === "failed" ? "alert" : undefined} className="mt-6 rounded-xl bg-white px-6 py-10 ring-1 ring-slate-200 sm:px-10">
              <h1 className="font-heading text-3xl font-semibold text-navy">
                {status === "missing" ? "We couldn't find that doctor" : "We couldn't load this profile"}
              </h1>
              <p className="mt-3 leading-relaxed text-slate-600">
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
        </div>
      </section>
    );
  }

  const name = `Dr. ${doctor.firstName} ${doctor.lastName}`;
  // the API lists the primary specialty first
  const main = doctor.specialties[0];

  return (
    <>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className={`${CONTAINER} py-8 sm:py-10`}>
          {backLink}
          <div className="mt-6 flex items-center gap-4 sm:gap-6">
            <DoctorAvatar firstName={doctor.firstName} lastName={doctor.lastName} className="h-16 w-16 text-xl sm:h-20 sm:w-20 sm:text-2xl" />
            <div className="min-w-0">
              <h1 className="font-heading text-3xl font-semibold text-navy sm:text-4xl">{name}</h1>
              <p className="mt-1 text-lg text-slate-600">{main ? main.name : "Specialty not listed"}</p>
            </div>
          </div>
        </div>
      </section>

      <div className={`${CONTAINER} grid gap-10 py-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-14 lg:py-12`}>
        <div className="space-y-10">
          <section aria-labelledby="specialties-heading">
            <h2 id="specialties-heading" className="font-heading text-2xl font-semibold text-navy">
              Specialties
            </h2>
            {doctor.specialties.length > 0 ? (
              <ul className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
                {doctor.specialties.map((s) => (
                  <li key={s.specialtyId} className="flex items-center justify-between gap-4 px-5 py-3.5">
                    <span className="font-medium text-slate-800">{s.name}</span>
                    {s.isPrimary && <span className="text-sm font-semibold text-teal-700">Primary specialty</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-slate-600">No specialties are currently listed for {name}.</p>
            )}
          </section>

          <section aria-labelledby="locations-heading">
            <h2 id="locations-heading" className="font-heading text-2xl font-semibold text-navy">
              Practice locations
            </h2>
            {doctor.offices.length > 0 ? (
              <ul className="mt-4 space-y-4">
                {doctor.offices.map((office) => (
                  <li key={office.officeId} className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                    <h3 className="text-lg font-semibold text-navy">{office.name}</h3>
                    <address className="mt-2 leading-relaxed text-slate-600 not-italic">
                      {office.street}
                      {office.apt && `, ${office.apt}`}
                      <br />
                      {office.city}, {office.state} {office.zip}
                    </address>
                    <a href={`tel:${office.phone}`} className={`mt-2 inline-block rounded font-semibold text-teal-700 hover:text-navy ${FOCUS}`}>
                      {office.phone}
                    </a>
                    <p className="mt-4 border-t border-slate-100 pt-4 text-slate-700">
                      <span className="font-semibold text-navy">Scheduled days:</span> {formatDays(office.days)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5 text-slate-600">
                {name}'s practice locations and schedule are not currently listed.
              </p>
            )}
            <Link to="/locations" className={`${TEXT_LINK} mt-5`}>
              View all clinic locations
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-navy">About scheduled days</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Scheduled days show when {name} regularly works at each office. They aren't a list of open appointment
              times.
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
    <section className="rounded-xl bg-slate-50 p-6 ring-1 ring-slate-200">
      <h2 className="font-semibold text-navy">Existing patients</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">View your appointments, medical records, and billing in the Patient Portal.</p>
      <Link to={portal.to} className={`${SECONDARY_BUTTON} mt-4`}>
        {`Go to ${portal.label}`}
      </Link>
    </section>
  );
}
