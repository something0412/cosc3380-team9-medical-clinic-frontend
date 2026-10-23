import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { DoctorAvatar } from "../../components/public/DoctorAvatar";
import { ArrowIcon } from "../../components/public/icons";
import { CONTAINER, FIELD_INPUT, FIELD_LABEL, FOCUS, SECONDARY_BUTTON, TEXT_LINK } from "../../components/public/shared";
import { getPublicDoctors, getPublicOffices, getPublicSpecialties } from "../../services/publicApi";
import type { PublicDoctor, PublicOffice, PublicSpecialty } from "../../services/publicApi";

export function FindDoctorPage() {
  const [doctors, setDoctors] = useState<PublicDoctor[]>([]);
  const [specialties, setSpecialties] = useState<PublicSpecialty[]>([]);
  const [offices, setOffices] = useState<PublicOffice[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    let active = true;

    async function loadDirectory() {
      try {
        const [doctorList, specialtyList, officeList] = await Promise.all([getPublicDoctors(), getPublicSpecialties(), getPublicOffices()]);
        if (active) {
          setDoctors(doctorList);
          setSpecialties(specialtyList);
          setOffices(officeList);
          setFailed(false);
        }
      } catch {
        if (active) setFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDirectory();
    return () => {
      active = false;
    };
  }, [attempt]);

  function retry() {
    setLoading(true);
    setAttempt((count) => count + 1);
  }

  // filters live in the URL so a filtered list can be shared and survives the back button
  function setFilter(name: string, value: string) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(name, value);
        else next.delete(name);
        return next;
      },
      { replace: true }
    );
  }

  function clearFilters() {
    setParams({}, { replace: true });
  }

  const search = params.get("q") ?? "";
  // IDs in the URL that don't match a current option are ignored
  const specialtyParam = params.get("specialty") ?? "";
  const officeParam = params.get("office") ?? "";
  const specialtyId = specialties.some((s) => String(s.specialtyId) === specialtyParam) ? specialtyParam : "";
  const officeId = offices.some((o) => String(o.officeId) === officeParam) ? officeParam : "";

  // every typed word has to appear in the name, so "jane smith" and "Dr. Smith" both match
  const words = search.toLowerCase().replace(/[.,]/g, " ").split(/\s+/).filter((word) => word && word !== "dr");

  const results = doctors.filter((doctor) => {
    const name = `${doctor.firstName} ${doctor.lastName}`.toLowerCase();
    return (
      words.every((word) => name.includes(word)) &&
      (!specialtyId || doctor.specialties.some((s) => String(s.specialtyId) === specialtyId)) &&
      (!officeId || doctor.offices.some((o) => String(o.officeId) === officeId))
    );
  });

  const hasFilters = params.toString() !== "";

  return (
    <>
      <section className={`${CONTAINER} pt-10 sm:pt-14`}>
        <h1 className="font-heading text-4xl font-semibold text-navy sm:text-5xl">Find a Doctor</h1>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-600">
          Browse our physicians by name, specialty, or clinic location, then open a profile to see where each doctor
          practices.
        </p>

        <form
          role="search"
          aria-label="Filter doctors"
          onSubmit={(e) => e.preventDefault()}
          className="mt-8 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end"
        >
          <label className="sm:col-span-2 lg:col-span-1">
            <span className={FIELD_LABEL}>Doctor name</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setFilter("q", e.target.value)}
              placeholder="First or last name"
              autoComplete="off"
              className={FIELD_INPUT}
            />
          </label>
          <label>
            <span className={FIELD_LABEL}>Specialty</span>
            <select value={specialtyId} onChange={(e) => setFilter("specialty", e.target.value)} className={FIELD_INPUT}>
              <option value="">All specialties</option>
              {specialties.map((s) => (
                <option key={s.specialtyId} value={s.specialtyId}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={FIELD_LABEL}>Location</span>
            <select value={officeId} onChange={(e) => setFilter("office", e.target.value)} className={FIELD_INPUT}>
              <option value="">All locations</option>
              {offices.map((o) => (
                <option key={o.officeId} value={o.officeId}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            className={`${TEXT_LINK} justify-self-start py-2 text-sm disabled:cursor-not-allowed disabled:text-slate-400`}
          >
            Clear filters
          </button>
        </form>
      </section>

      <section aria-label="Doctors" className={`${CONTAINER} pt-10 pb-16 lg:pb-20`}>
        {loading ? (
          <p className="border-t border-slate-200 py-8 text-slate-600">Loading doctors...</p>
        ) : failed ? (
          <div role="alert" className="border-t border-slate-200 py-8">
            <p className="font-semibold text-navy">We couldn't load the doctor directory.</p>
            <p className="mt-1 text-slate-600">Please check your connection and try again.</p>
            <button type="button" onClick={retry} className={`${SECONDARY_BUTTON} mt-4`}>
              Try again
            </button>
          </div>
        ) : doctors.length === 0 ? (
          <p className="border-t border-slate-200 py-8 text-slate-600">No doctors are listed right now. Please check back later.</p>
        ) : (
          <>
            <p aria-live="polite" className="text-sm text-slate-600">
              Showing {results.length} of {doctors.length} {doctors.length === 1 ? "doctor" : "doctors"}
            </p>

            {results.length > 0 ? (
              <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
                {results.map((doctor) => (
                  <DoctorRow key={doctor.doctorId} doctor={doctor} />
                ))}
              </ul>
            ) : (
              <div className="mt-3 border-y border-slate-200 py-8">
                <p className="font-semibold text-navy">No doctors match your search.</p>
                <p className="mt-1 text-slate-600">Try another name, specialty, or location.</p>
                <button type="button" onClick={clearFilters} className={`${SECONDARY_BUTTON} mt-4`}>
                  Clear filters
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}

function DoctorRow({ doctor }: { doctor: PublicDoctor }) {
  const location = useLocation();
  const name = `Dr. ${doctor.firstName} ${doctor.lastName}`;
  const profile = `/find-a-doctor/${doctor.doctorId}`;
  // the API lists the primary specialty first
  const [main, ...others] = doctor.specialties;
  // remember the filters so the profile can link back to the same results
  const linkState = { search: location.search };

  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-2 py-6 md:grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-center md:gap-x-8">
      <DoctorAvatar firstName={doctor.firstName} lastName={doctor.lastName} className="row-span-3 h-12 w-12 self-start text-base md:row-span-1 md:self-center" />

      <div>
        <h2 className="text-xl font-semibold text-navy">
          <Link to={profile} state={linkState} className={`rounded hover:underline ${FOCUS}`}>
            {name}
          </Link>
        </h2>
        <p className="mt-0.5 text-slate-700">{main ? main.name : "Specialty not listed"}</p>
        {others.length > 0 && <p className="text-sm text-slate-500">Also {others.map((s) => s.name).join(", ")}</p>}
      </div>

      <p className="text-slate-600">
        {doctor.offices.length > 0 ? doctor.offices.map((o) => o.name).join(", ") : "Practice location not listed"}
      </p>

      <Link
        to={profile}
        state={linkState}
        aria-label={`View profile, ${name}`}
        className={`${TEXT_LINK} justify-self-start text-sm md:justify-self-end`}
      >
        View profile
        <ArrowIcon className="h-4 w-4" />
      </Link>
    </li>
  );
}
