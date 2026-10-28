import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { ADMIN_SECONDARY_BUTTON } from "../../components/admin/styles";
import { Field, SelectField } from "../../components/FormControls";
import { PageError, PortalPage } from "../../components/PortalPage";
import { StatusBadge } from "../../components/ProfileUI";

interface Appointment {
  appointmentId: number;
  patientId: number;
  patientName: string;
  date: string;
  startTime: string;
  doctorName: string;
  specialty: string;
  officeName: string;
  status: string;
  checkedIn: boolean;
}

interface Office {
  officeId: number;
  name: string;
}

// today's date at the clinic as YYYY-MM-DD
const clinicToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });

export function NurseAppointments() {
  // the filters live in the URL, so going back to this page keeps them
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const date = params.get("date") ?? clinicToday();
  const name = params.get("name") ?? "";
  // no office in the URL means my office, "all" means every office
  const [myOfficeId, setMyOfficeId] = useState("");
  const officeId = params.get("office") ?? myOfficeId;

  const [offices, setOffices] = useState<Office[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // change one filter and keep the others
  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next, { replace: true });
  }

  // load the offices for the filter and my office
  useEffect(() => {
    async function loadOffices() {
      try {
        const res = await api.get<Office[]>("/api/public/offices");
        setOffices(res.data);
        const mine = await api.get<{ officeId: number }>("/api/nurse/my-office");
        setMyOfficeId(String(mine.data.officeId));
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    loadOffices();
  }, []);

  // load the appointments that match the filters
  useEffect(() => {
    // a newer search replaces this one, so its late answer is ignored
    let ignore = false;
    async function loadAppointments() {
      // wait until my office is known
      if (!officeId) return;
      setError("");
      if (!date && !name.trim()) {
        setAppointments([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get<Appointment[]>("/api/nurse/appointments", {
          params: { date: date || undefined, name: name.trim() || undefined, officeId: officeId === "all" ? undefined : officeId },
        });
        if (!ignore) setAppointments(res.data);
      } catch (err) {
        if (!ignore) setError(apiErrorMessage(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadAppointments();
    return () => {
      ignore = true;
    };
  }, [date, name, officeId]);

  const needsFilter = !date && !name.trim();

  return (
    <PortalPage
      eyebrow="Nursing"
      title="Patient Appointments"
      description="Search by patient name, day or office. Clear the day to see a patient's whole visit history. Intake can only be edited on the day of the appointment."
    >
      <div className="flex flex-wrap items-end gap-4 rounded-lg shadow-box bg-slate-50 p-4">
        <div className="w-64">
          <Field label="Patient name" placeholder="Search by name" value={name} onChange={(e) => setFilter("name", e.target.value)} />
        </div>
        <div className="w-48">
          <Field label="Day" type="date" value={date} onChange={(e) => setFilter("date", e.target.value)} />
        </div>
        <div className="w-56">
          <SelectField label="Office" value={officeId} onChange={(e) => setFilter("office", e.target.value)}>
            <option value="all">All offices</option>
            {offices.map((o) => (
              <option key={o.officeId} value={o.officeId}>
                {o.name}
              </option>
            ))}
          </SelectField>
        </div>
        {date && (
          <button type="button" onClick={() => setFilter("date", "")} className={ADMIN_SECONDARY_BUTTON}>
            Any day
          </button>
        )}
        {date !== clinicToday() && (
          <button type="button" onClick={() => setFilter("date", clinicToday())} className={ADMIN_SECONDARY_BUTTON}>
            Today
          </button>
        )}
      </div>

      <PageError message={error} />

      <section className="overflow-hidden rounded-lg shadow-box bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Specialty</th>
                <th className="px-4 py-3">Office</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {needsFilter ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">Choose a day or type a patient name.</td></tr>
              ) : loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">Loading appointments...</td></tr>
              ) : appointments.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">No appointments match these filters.</td></tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.appointmentId} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{a.date}</td>
                    <td className="px-4 py-3 text-slate-700">{a.startTime}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">{a.patientName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">Dr. {a.doctorName}</td>
                    <td className="px-4 py-3 text-slate-700">{a.specialty}</td>
                    <td className="px-4 py-3 text-slate-700">{a.officeName}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status === "Scheduled" && a.checkedIn ? "Checked In" : a.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/staff/nurse/appointments/${a.appointmentId}`}
                        state={{ back: location.pathname + location.search }}
                        className="whitespace-nowrap font-medium text-navy hover:text-teal-700 hover:underline"
                      >
                        Open intake
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </PortalPage>
  );
}
