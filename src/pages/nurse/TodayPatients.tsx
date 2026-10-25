import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { ADMIN_SECONDARY_BUTTON } from "../../components/admin/styles";
import { Field } from "../../components/FormControls";
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
  status: string;
  checkedIn: boolean;
  checkedInAt: string | null;
}

export function NurseTodayPatients() {
  const [date, setDate] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // load appointments for the day
  useEffect(() => {
    async function loadAppointments() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get<Appointment[]>("/api/nurse/appointments", { params: { date: date || undefined } });
        setAppointments(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadAppointments();
  }, [date]);

  return (
    <PortalPage
      eyebrow="Nursing"
      title="Today's Patients"
      description="Appointments at your office. Vitals and notes can be recorded once the front desk checks the patient in."
    >
      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="w-48">
          <Field label="Day" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        {date && (
          <button type="button" onClick={() => setDate("")} className={ADMIN_SECONDARY_BUTTON}>
            Back to today
          </button>
        )}
      </div>

      <PageError message={error} />

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Specialty</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Loading appointments...</td></tr>
              ) : appointments.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No appointments on this day.</td></tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.appointmentId} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">{a.startTime}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link to={`/staff/nurse/today/${a.appointmentId}`} className="font-medium text-navy hover:text-teal-700 hover:underline">
                        {a.patientName}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">Dr. {a.doctorName}</td>
                    <td className="px-4 py-3 text-slate-700">{a.specialty}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status === "Scheduled" && a.checkedIn ? "Checked In" : a.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/staff/nurse/today/${a.appointmentId}`}
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
