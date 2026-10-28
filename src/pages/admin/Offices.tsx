import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiErrorMessage } from "../../api";
import { AdminPage } from "../../components/admin/AdminPage";
import { ActiveBadge } from "../../components/admin/StatusBadges";
import { ADMIN_PRIMARY_BUTTON } from "../../components/admin/styles";
import { Field, SelectField } from "../../components/FormControls";
import { getOffices } from "../../services/adminApi";
import type { Office } from "../../services/adminApi";

const ALL = "all";

export function AdminOffices() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [state, setState] = useState(ALL);
  const [status, setStatus] = useState(ALL);

  useEffect(() => {
    let active = true;

    async function loadOffices() {
      try {
        const data = await getOffices();
        if (active) setOffices(data);
      } catch (err) {
        if (active) setError(apiErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOffices();
    return () => {
      active = false;
    };
  }, []);

  const stateOptions = [...new Set(offices.map((o) => o.state))].sort();

  const query = search.trim().toLowerCase();
  const filtered = offices.filter(
    (o) =>
      (!query || [o.name, o.city, o.state].some((value) => value.toLowerCase().includes(query))) &&
      (state === ALL || o.state === state) &&
      (status === ALL || o.isActive === (status === "active"))
  );

  const hasFilters = query !== "" || state !== ALL || status !== ALL;

  function clearFilters() {
    setSearch("");
    setState(ALL);
    setStatus(ALL);
  }

  return (
    <AdminPage
      title="Offices"
      description="View clinic locations, contact details, and status."
      actions={
        <Link to="/admin/offices/new" className={ADMIN_PRIMARY_BUTTON}>
          Add Office
        </Link>
      }
    >
      <div className="grid gap-4 rounded-lg shadow-box bg-slate-50 p-4 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr]">
        <Field
          label="Search"
          type="search"
          placeholder="Office name, city, or state"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <SelectField label="State" value={state} onChange={(e) => setState(e.target.value)}>
          <option value={ALL}>All states</option>
          {stateOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </SelectField>
        <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value={ALL}>All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </SelectField>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Offices could not be loaded. {error}
        </p>
      ) : (
        <section className="overflow-hidden rounded-lg shadow-box bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 text-sm text-slate-600">
            <span>{loading ? "Loading offices..." : `Showing ${filtered.length} of ${offices.length} offices`}</span>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="font-medium text-navy hover:text-teal-700">
                Clear filters
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Office</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      {offices.length === 0 ? "No offices found." : "No offices match your search and filters."}
                    </td>
                  </tr>
                )}
                {filtered.map((o) => (
                  <tr key={o.officeId} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-slate-500">{o.officeId}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-navy">{o.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{o.city}, {o.state}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{o.phone}</td>
                    <td className="px-4 py-3"><ActiveBadge isActive={o.isActive} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/offices/${o.officeId}`}
                        className="whitespace-nowrap font-medium text-navy hover:text-teal-700 hover:underline"
                      >
                        View details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </AdminPage>
  );
}
