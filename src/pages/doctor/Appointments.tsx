import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { ADMIN_PRIMARY_BUTTON } from "../../components/admin/styles";
import { Field } from "../../components/FormControls";
import { PageError, PortalPage } from "../../components/PortalPage";
import { StatusBadge } from "../../components/ProfileUI";

interface Appointment {
  appointmentId: number;
  patientId: number;
  patientName: string;
  date: string;
  startTime: string;
  specialty: string;
  officeName: string;
  status: string;
  referralId: number | null;
  checkedIn: boolean;
}

const VIEWS = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "all", label: "All" },
];

export function DoctorAppointments() {
  const [view, setView] = useState("today");
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // load my appointments
  useEffect(() => {
    async function loadAppointments() {
      setLoading(true);
      try {
        const res = await api.get<Appointment[]>("/api/doctor/appointments", { params: { view, search } });
        setAppointments(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadAppointments();
  }, [view, search]);

  // search by patient name
  function handleSearch(e: FormEvent) {
    e.preventDefault();
    setSearch(searchText);
  }

  return (
    <PortalPage
      eyebrow="Doctor"
      title="Appointments"
      description="Open a visit to write notes, diagnoses and prescriptions once the front desk checks the patient in."
    >
      <div className="flex gap-6 border-b border-slate-200">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => setView(v.key)}
            className={`-mb-px border-b-2 pb-3 text-sm font-semibold ${
              view === v.key ? "border-navy text-navy" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch} className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label="Patient" type="search" placeholder="Patient name" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        <button type="submit" className={ADMIN_PRIMARY_BUTTON}>Search</button>
      </form>

      <PageError message={error} />

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Specialty</th>
                <th className="px-4 py-3">Office</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Loading appointments...</td></tr>
              ) : appointments.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">{search ? `No appointments for "${search}".` : "No appointments."}</td></tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.appointmentId} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{a.date}</td>
                    <td className="px-4 py-3 text-slate-700">{a.startTime}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link to={`/doctor/patients/${a.patientId}`} className="font-medium text-navy hover:text-teal-700 hover:underline">
                        {a.patientName}
                      </Link>
                      {a.referralId && <span className="ml-2 text-xs text-slate-500">referral</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{a.specialty}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{a.officeName}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status === "Scheduled" && a.checkedIn ? "Checked In" : a.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/doctor/appointments/${a.appointmentId}`}
                        className="whitespace-nowrap font-medium text-navy hover:text-teal-700 hover:underline"
                      >
                        Open visit
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
