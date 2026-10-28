import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiErrorMessage } from "../../api";
import { AdminPage } from "../../components/admin/AdminPage";
import { ActiveBadge, ReferralBadge } from "../../components/admin/StatusBadges";
import { ADMIN_PRIMARY_BUTTON } from "../../components/admin/styles";
import { Field, SelectField } from "../../components/FormControls";
import { getSpecialties } from "../../services/adminApi";
import type { Specialty } from "../../services/adminApi";

const ALL = "all";

export function AdminSpecialties() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [referral, setReferral] = useState(ALL);
  const [status, setStatus] = useState(ALL);

  useEffect(() => {
    let active = true;

    async function loadSpecialties() {
      try {
        const data = await getSpecialties();
        if (active) setSpecialties(data);
      } catch (err) {
        if (active) setError(apiErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSpecialties();
    return () => {
      active = false;
    };
  }, []);

  const query = search.trim().toLowerCase();
  const filtered = specialties.filter(
    (s) =>
      (!query || s.name.toLowerCase().includes(query)) &&
      (referral === ALL || s.requiresReferral === (referral === "yes")) &&
      (status === ALL || s.isActive === (status === "active"))
  );

  const hasFilters = query !== "" || referral !== ALL || status !== ALL;

  function clearFilters() {
    setSearch("");
    setReferral(ALL);
    setStatus(ALL);
  }

  return (
    <AdminPage
      title="Specialties"
      description="Manage the medical specialties offered by the clinic and whether they require a referral."
      actions={
        <Link to="/admin/specialties/new" className={ADMIN_PRIMARY_BUTTON}>
          Add Specialty
        </Link>
      }
    >
      <div className="grid gap-4 rounded-lg shadow-box bg-slate-50 p-4 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr]">
        <Field label="Search" type="search" placeholder="Specialty name" value={search} onChange={(e) => setSearch(e.target.value)} />
        <SelectField label="Referral Required" value={referral} onChange={(e) => setReferral(e.target.value)}>
          <option value={ALL}>All</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </SelectField>
        <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value={ALL}>All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </SelectField>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Specialties could not be loaded. {error}
        </p>
      ) : (
        <section className="overflow-hidden rounded-lg shadow-box bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 text-sm text-slate-600">
            <span>{loading ? "Loading specialties..." : `Showing ${filtered.length} of ${specialties.length} specialties`}</span>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="font-medium text-navy hover:text-teal-700">
                Clear filters
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Specialty</th>
                  <th className="px-4 py-3">Referral</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                      {specialties.length === 0 ? "No specialties found." : "No specialties match your search and filters."}
                    </td>
                  </tr>
                )}
                {filtered.map((s) => (
                  <tr key={s.specialtyId} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-slate-500">{s.specialtyId}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-navy">{s.name}</td>
                    <td className="px-4 py-3"><ReferralBadge requiresReferral={s.requiresReferral} /></td>
                    <td className="px-4 py-3"><ActiveBadge isActive={s.isActive} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/specialties/${s.specialtyId}`}
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
