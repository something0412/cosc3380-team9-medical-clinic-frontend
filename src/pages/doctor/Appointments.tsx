import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { StatusBadge } from "../../components/ProfileUI";

interface Appointment {
  appointmentId: number;
  patientId: number;
  patientName: string;
  date: string;
  time: string;
  specialty: string;
  officeName: string;
  status: string;
  fromReferral: boolean;
  hasSummary: boolean;
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
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <p className="mt-1 text-gray-600">Open a visit to write notes and prescriptions.</p>
      </div>

      <div className="flex gap-6 border-b border-gray-200">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => setView(v.key)}
            className={`-mb-px border-b-2 pb-3 text-sm font-medium ${
              view === v.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch} className="flex max-w-md gap-2">
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search by patient name"
          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearchText("");
              setSearch("");
            }}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </form>

      {error && <p className="text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full whitespace-nowrap text-left text-sm">
          <thead className="bg-gray-50">
            <tr className="border-b text-gray-500">
              <th className="p-3 font-medium">Date</th>
              <th className="p-3 font-medium">Time</th>
              <th className="p-3 font-medium">Patient</th>
              <th className="p-3 font-medium">Specialty</th>
              <th className="p-3 font-medium">Office</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Notes</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-3 text-gray-500">Loading appointments...</td></tr>
            ) : appointments.length === 0 ? (
              <tr><td colSpan={8} className="p-3 text-gray-500">{search ? `No appointments for "${search}".` : "No appointments."}</td></tr>
            ) : (
              appointments.map((a) => (
                <tr key={a.appointmentId} className="border-b last:border-0">
                  <td className="p-3">{a.date}</td>
                  <td className="p-3">{a.time}</td>
                  <td className="p-3">
                    <Link to={`/doctor/patients/${a.patientId}`} className="font-medium text-blue-600 hover:underline">
                      {a.patientName}
                    </Link>
                    {a.fromReferral && (
                      <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-800">Referral</span>
                    )}
                  </td>
                  <td className="p-3">{a.specialty}</td>
                  <td className="p-3">{a.officeName}</td>
                  <td className="p-3"><StatusBadge status={a.status} /></td>
                  <td className="p-3">{a.hasSummary ? "✓ Written" : "—"}</td>
                  <td className="p-3">
                    <Link to={`/doctor/appointments/${a.appointmentId}`} className="text-blue-600 hover:underline">
                      Open visit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
