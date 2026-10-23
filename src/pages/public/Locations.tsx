import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { OfficeAddress } from "../../components/public/OfficeAddress";
import { CONTAINER, FIELD_INPUT, FIELD_LABEL, FOCUS, SECONDARY_BUTTON } from "../../components/public/shared";
import { getPublicOffices } from "../../services/publicApi";
import type { PublicOffice } from "../../services/publicApi";
import { stateName } from "../../utils/states";

export function LocationsPage() {
  const [offices, setOffices] = useState<PublicOffice[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [params, setParams] = useSearchParams();

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

  // filters live in the URL so a search can be shared and survives the back button
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

  const sorted = [...offices].sort(
    (a, b) => stateName(a.state).localeCompare(stateName(b.state)) || a.city.localeCompare(b.city) || a.name.localeCompare(b.name)
  );

  // only states that have an office, so new states appear on their own
  const states = [...new Set(offices.map((o) => o.state.toUpperCase()))].sort((a, b) => stateName(a).localeCompare(stateName(b)));

  const search = params.get("q") ?? "";
  const stateParam = (params.get("state") ?? "").toUpperCase();
  const state = states.includes(stateParam) ? stateParam : "";

  // every typed word has to appear somewhere in the office name or address
  const words = search.toLowerCase().replace(/,/g, " ").split(/\s+/).filter(Boolean);

  const results = sorted.filter((office) => {
    const text = [office.name, office.street, office.apt, office.city, office.state, stateName(office.state), office.zip].join(" ").toLowerCase();
    return words.every((word) => text.includes(word)) && (!state || office.state.toUpperCase() === state);
  });

  const hasFilters = params.toString() !== "";

  return (
    <>
      <section className="border-b border-slate-200 bg-slate-50">
        <div className={`${CONTAINER} py-10 sm:py-12`}>
          <h1 className="font-heading text-4xl font-semibold text-navy sm:text-5xl">Locations</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-600">
            Explore our clinic locations and find the office that works best for you.
          </p>

          <form
            role="search"
            aria-label="Filter locations"
            onSubmit={(e) => e.preventDefault()}
            className="mt-8 grid gap-4 rounded-xl bg-white p-5 ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] lg:items-end"
          >
            <label className="sm:col-span-2 lg:col-span-1">
              <span className={FIELD_LABEL}>Search locations</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setFilter("q", e.target.value)}
                placeholder="City, state, or ZIP code"
                autoComplete="off"
                className={FIELD_INPUT}
              />
            </label>
            <label>
              <span className={FIELD_LABEL}>State</span>
              <select value={state} onChange={(e) => setFilter("state", e.target.value)} className={FIELD_INPUT}>
                <option value="">All states</option>
                {states.map((code) => (
                  <option key={code} value={code}>
                    {stateName(code)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasFilters}
              className={`${SECONDARY_BUTTON} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              Clear filters
            </button>
          </form>
        </div>
      </section>

      <section aria-label="Clinic locations" className={`${CONTAINER} py-10 lg:py-12`}>
        {loading ? (
          <p className="text-slate-600">Loading locations...</p>
        ) : failed ? (
          <div role="alert" className="rounded-xl border border-slate-200 bg-white p-6">
            <p className="font-semibold text-navy">We couldn't load our locations.</p>
            <p className="mt-1 text-slate-600">Please check your connection and try again.</p>
            <button type="button" onClick={retry} className={`${SECONDARY_BUTTON} mt-4`}>
              Try again
            </button>
          </div>
        ) : offices.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">No locations are listed right now. Please check back later.</p>
        ) : (
          <>
            <p aria-live="polite" className="text-sm text-slate-600">
              Showing {results.length} of {offices.length} {offices.length === 1 ? "location" : "locations"}
            </p>

            {results.length > 0 ? (
              <ul className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
                {results.map((office) => (
                  <LocationRow key={office.officeId} office={office} />
                ))}
              </ul>
            ) : (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6">
                <p className="font-semibold text-navy">No locations match your search.</p>
                <p className="mt-1 text-slate-600">Try another city, state, or ZIP code.</p>
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

function LocationRow({ office }: { office: PublicOffice }) {
  const location = useLocation();
  const details = `/locations/${office.officeId}`;
  // remember the filters so the details page can link back to the same results
  const linkState = { search: location.search };

  return (
    <li className="grid gap-4 p-5 sm:p-6 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] md:items-center md:gap-6">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold break-words text-navy">
          <Link to={details} state={linkState} className={`rounded hover:underline ${FOCUS}`}>
            {office.name}
          </Link>
        </h2>
        <OfficeAddress office={office} className="mt-1 text-slate-600" />
      </div>

      <div>
        <p className="text-sm text-slate-500">Phone</p>
        <a href={`tel:${office.phone}`} className={`rounded font-semibold text-teal-700 hover:text-navy ${FOCUS}`}>
          {office.phone}
        </a>
      </div>

      <Link
        to={details}
        state={linkState}
        aria-label={`View location, ${office.name}`}
        className={`${SECONDARY_BUTTON} md:justify-self-end`}
      >
        View location
      </Link>
    </li>
  );
}
