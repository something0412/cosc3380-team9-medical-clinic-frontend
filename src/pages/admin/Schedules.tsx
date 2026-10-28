import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { apiErrorMessage } from "../../api";
import { AdminPage } from "../../components/admin/AdminPage";
import { ActiveBadge } from "../../components/admin/StatusBadges";
import { ADMIN_PRIMARY_BUTTON } from "../../components/admin/styles";
import { Field, SelectField } from "../../components/FormControls";
import { WEEKDAYS, getSchedules } from "../../services/adminApi";
import type { Schedule } from "../../services/adminApi";
import { formatId } from "../../utils/id";

const ALL = "all";

// switches between weekly schedules and shift settings
export function ScheduleTabs() {
  const tab = ({ isActive }: { isActive: boolean }) =>
    `-mb-px border-b-2 px-1 pb-3 text-sm font-medium ${isActive ? "border-teal-600 text-navy" : "border-transparent text-slate-500 hover:text-navy"}`;
  return (
    <nav className="-mt-2 flex gap-6 border-b border-slate-200" aria-label="Schedule sections">
      <NavLink to="/admin/schedules" end className={tab}>
        Doctor Schedules
      </NavLink>
      <NavLink to="/admin/schedules/shifts" className={tab}>
        Shifts &amp; Time Slots
      </NavLink>
    </nav>
  );
}

const doctorName = (s: Schedule) => `${s.doctorFirstName} ${s.doctorLastName}`;

// unique id/name pairs for a filter dropdown, sorted by name
function filterOptions(pairs: [number, string][]) {
  return [...new Map(pairs)].sort((a, b) => a[1].localeCompare(b[1]));
}

export function AdminSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [doctorId, setDoctorId] = useState(ALL);
  const [officeId, setOfficeId] = useState(ALL);
  const [day, setDay] = useState(ALL);
  const [status, setStatus] = useState(ALL);

  useEffect(() => {
    let active = true;

    async function loadSchedules() {
      try {
        const data = await getSchedules();
        if (active) setSchedules(data);
      } catch (err) {
        if (active) setError(apiErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSchedules();
    return () => {
      active = false;
    };
  }, []);

  const doctorOptions = filterOptions(schedules.map((s) => [s.doctorId, doctorName(s)]));
  const officeOptions = filterOptions(schedules.map((s) => [s.officeId, s.officeName]));

  const query = search.trim().toLowerCase();
  const filtered = schedules.filter(
    (s) =>
      (!query || doctorName(s).toLowerCase().includes(query) || formatId(s.doctorId).includes(query)) &&
      (doctorId === ALL || String(s.doctorId) === doctorId) &&
      (officeId === ALL || String(s.officeId) === officeId) &&
      (day === ALL || s.dayOfWeek === day) &&
      (status === ALL || s.isActive === (status === "active"))
  );

  const hasFilters = query !== "" || doctorId !== ALL || officeId !== ALL || day !== ALL || status !== ALL;

  function clearFilters() {
    setSearch("");
    setDoctorId(ALL);
    setOfficeId(ALL);
    setDay(ALL);
    setStatus(ALL);
  }

  return (
    <AdminPage
      title="Schedules"
      description="Assign each doctor to an office, specialty, and shift for each day of the week."
      actions={
        <Link to="/admin/schedules/new" className={ADMIN_PRIMARY_BUTTON}>
          Add Schedule
        </Link>
      }
    >
      <ScheduleTabs />

      <div className="grid gap-4 rounded-lg shadow-box bg-slate-50 p-4 sm:grid-cols-2 xl:grid-cols-[1.6fr_1.4fr_1.4fr_1.2fr_1.2fr]">
        <Field label="Search" type="search" placeholder="Doctor name or staff ID" value={search} onChange={(e) => setSearch(e.target.value)} />
        <SelectField label="Doctor" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
          <option value={ALL}>All doctors</option>
          {doctorOptions.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </SelectField>
        <SelectField label="Office" value={officeId} onChange={(e) => setOfficeId(e.target.value)}>
          <option value={ALL}>All offices</option>
          {officeOptions.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </SelectField>
        <SelectField label="Day" value={day} onChange={(e) => setDay(e.target.value)}>
          <option value={ALL}>All days</option>
          {WEEKDAYS.map((d) => (
            <option key={d} value={d}>{d}</option>
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
          Schedules could not be loaded. {error}
        </p>
      ) : !loading && schedules.length === 0 ? (
        <section className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <p className="font-medium text-navy">No doctor schedules have been set up yet.</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Create at least one shift under{" "}
            <Link to="/admin/schedules/shifts" className="font-medium text-navy underline hover:text-teal-700">
              Shifts &amp; Time Slots
            </Link>
            , then use Add Schedule to assign doctors to offices by weekday.
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-lg shadow-box bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 text-sm text-slate-600">
            <span>{loading ? "Loading schedules..." : `Showing ${filtered.length} of ${schedules.length} schedules`}</span>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="font-medium text-navy hover:text-teal-700">
                Clear filters
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Doctor</th>
                  <th className="px-4 py-3">Day</th>
                  <th className="px-4 py-3">Office</th>
                  <th className="px-4 py-3">Specialty</th>
                  <th className="px-4 py-3">Shift</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                      No schedules match your search and filters.
                    </td>
                  </tr>
                )}
                {filtered.map((s) => (
                  <tr key={`${s.doctorId}-${s.dayOfWeek}`} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="font-medium text-navy">{doctorName(s)}</div>
                      <div className="font-mono text-xs text-slate-500">{formatId(s.doctorId)}</div>
                      {!s.doctorIsActive && <div className="text-xs font-medium text-amber-700">Doctor inactive</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{s.dayOfWeek}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{s.officeName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{s.specialtyName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {s.shiftName}
                      <span className="block text-xs text-slate-500">{s.startTime}–{s.endTime}</span>
                    </td>
                    <td className="px-4 py-3"><ActiveBadge isActive={s.isActive} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/schedules/${s.doctorId}/${s.dayOfWeek}/edit`}
                        className="whitespace-nowrap font-medium text-navy hover:text-teal-700 hover:underline"
                      >
                        View / Edit
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
