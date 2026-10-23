import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiErrorMessage } from "../../api";
import { AdminPage } from "../../components/admin/AdminPage";
import { ActiveBadge, LoginStatusBadge } from "../../components/admin/StatusBadges";
import { ADMIN_PRIMARY_BUTTON } from "../../components/admin/styles";
import { Field, SelectField } from "../../components/FormControls";
import { getEmployees } from "../../services/adminApi";
import type { AdminEmployee } from "../../services/adminApi";
import { formatId } from "../../utils/id";

const ALL = "all";

// unique id/name pairs for a filter dropdown, sorted by name
function filterOptions(pairs: [number, string][]) {
  return [...new Map(pairs)].sort((a, b) => a[1].localeCompare(b[1]));
}

export function AdminEmployees() {
  const [employees, setEmployees] = useState<AdminEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [typeId, setTypeId] = useState(ALL);
  const [officeId, setOfficeId] = useState(ALL);
  const [status, setStatus] = useState(ALL);

  useEffect(() => {
    let active = true;

    async function loadEmployees() {
      try {
        const data = await getEmployees();
        if (active) setEmployees(data);
      } catch (err) {
        if (active) setError(apiErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEmployees();
    return () => {
      active = false;
    };
  }, []);

  const typeOptions = filterOptions(employees.map((e) => [e.employeeTypeId, e.employeeType]));
  const officeOptions = filterOptions(employees.map((e) => [e.officeId, e.officeName]));

  const query = search.trim().toLowerCase();
  const filtered = employees.filter(
    (e) =>
      (!query || `${e.firstName} ${e.lastName}`.toLowerCase().includes(query) || formatId(e.employeeId).includes(query)) &&
      (typeId === ALL || String(e.employeeTypeId) === typeId) &&
      (officeId === ALL || String(e.officeId) === officeId) &&
      (status === ALL || e.isActive === (status === "active"))
  );

  const hasFilters = query !== "" || typeId !== ALL || officeId !== ALL || status !== ALL;

  function clearFilters() {
    setSearch("");
    setTypeId(ALL);
    setOfficeId(ALL);
    setStatus(ALL);
  }

  return (
    <AdminPage
      title="Employees"
      description="View employee accounts, roles, and office assignments."
      actions={
        <Link to="/admin/employees/new" className={ADMIN_PRIMARY_BUTTON}>
          Add Employee
        </Link>
      }
    >
      <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr]">
        <Field
          label="Search"
          type="search"
          placeholder="Name or staff ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <SelectField label="Role" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
          <option value={ALL}>All roles</option>
          {typeOptions.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </SelectField>
        <SelectField label="Office" value={officeId} onChange={(e) => setOfficeId(e.target.value)}>
          <option value={ALL}>All offices</option>
          {officeOptions.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
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
          Employees could not be loaded. {error}
        </p>
      ) : (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 text-sm text-slate-600">
            <span>{loading ? "Loading employees..." : `Showing ${filtered.length} of ${employees.length} employees`}</span>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="font-medium text-navy hover:text-teal-700">
                Clear filters
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Staff ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Office</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Login</th>
                  <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                      {employees.length === 0 ? "No employees found." : "No employees match your search and filters."}
                    </td>
                  </tr>
                )}
                {filtered.map((e) => (
                  <tr key={e.employeeId} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-slate-500">{formatId(e.employeeId)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-navy">{e.firstName} {e.lastName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{e.employeeType}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{e.officeName}</td>
                    <td className="px-4 py-3"><ActiveBadge isActive={e.isActive} /></td>
                    <td className="px-4 py-3"><LoginStatusBadge hasLogin={e.hasLogin} loginActive={e.loginActive} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/employees/${e.employeeId}`}
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
