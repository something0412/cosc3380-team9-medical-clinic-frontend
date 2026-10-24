import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { StatusBadge } from "../../components/ProfileUI";

interface Appointment {
  appointmentId: number;
  patientId: number;
  patientName: string;
  time: string;
  doctorName: string;
  specialty: string;
  status: string;
  hasVitals: boolean;
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
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Today's Patients</h1>
        <p className="mt-1 text-gray-600">Appointments at your office and their vitals.</p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Day</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          />
        </label>
        {date && (
          <button
            type="button"
            onClick={() => setDate("")}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Back to today
          </button>
        )}
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full whitespace-nowrap text-left text-sm">
          <thead className="bg-gray-50">
            <tr className="border-b text-gray-500">
              <th className="p-3 font-medium">Time</th>
              <th className="p-3 font-medium">Patient</th>
              <th className="p-3 font-medium">Doctor</th>
              <th className="p-3 font-medium">Specialty</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Vitals</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-3 text-gray-500">Loading appointments...</td></tr>
            ) : appointments.length === 0 ? (
              <tr><td colSpan={7} className="p-3 text-gray-500">No appointments on this day.</td></tr>
            ) : (
              appointments.map((a) => (
                <tr key={a.appointmentId} className="border-b last:border-0">
                  <td className="p-3">{a.time}</td>
                  <td className="p-3">
                    <Link to={`/staff/nurse/today/${a.appointmentId}`} className="font-medium text-blue-600 hover:underline">
                      {a.patientName}
                    </Link>
                  </td>
                  <td className="p-3">Dr. {a.doctorName}</td>
                  <td className="p-3">{a.specialty}</td>
                  <td className="p-3"><StatusBadge status={a.status} /></td>
                  <td className="p-3">
                    {a.hasVitals ? (
                      <span className="text-green-700">Done</span>
                    ) : (
                      <span className="text-yellow-700">Not yet</span>
                    )}
                  </td>
                  <td className="p-3">
                    <Link to={`/staff/nurse/today/${a.appointmentId}`} className="text-blue-600 hover:underline">
                      Open intake
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
