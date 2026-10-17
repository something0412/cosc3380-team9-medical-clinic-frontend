import { useEffect, useState } from "react";
import { PatientChart } from "../../../components/PatientChart";
import { getPatients, getTodaysAppointments } from "../../../services/nursingApi";
import type { Appointment, Patient } from "../../../types";

// Patient Charts: any nurse (RN, CRNA or NA) can look up any patient's
// chart here — allergies, blood type, vitals, medications and notes.
// It's view-only; charting is done on each nurse type's own page.
export function PatientCharts() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setPatients(await getPatients());
      } catch {
        setError("Could not load patients.");
      }
      // Today's appointments are only used to show check-in status, so
      // the page still works if this one fails.
      try {
        setAppointments(await getTodaysAppointments());
      } catch {
        setAppointments([]);
      }
    }
    loadData();
  }, []);

  const filtered = patients.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()),
  );
  const todaysAppointment = (patientId: number) =>
    appointments.find((a) => a.patientId === patientId);

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Patient Charts</h1>
      <p className="mt-1 text-sm text-gray-500">
        Look up any patient's allergies, blood type, vitals, medications and notes.
      </p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid gap-6 md:grid-cols-[18rem_1fr]">
        <div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
            className="mb-3 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <ul className="space-y-1">
            {filtered.map((p) => (
              <li key={p.patientId}>
                <button
                  type="button"
                  onClick={() => setSelectedId(p.patientId)}
                  className={`w-full rounded px-3 py-2 text-left text-sm ${
                    p.patientId === selectedId ? "bg-blue-50 font-medium" : "hover:bg-gray-50"
                  }`}
                >
                  {p.lastName}, {p.firstName}
                  {todaysAppointment(p.patientId) && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({todaysAppointment(p.patientId)?.status})
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded border border-gray-200 bg-white p-4">
          {selectedId ? (
            <PatientChart patientId={selectedId} appointment={todaysAppointment(selectedId)} />
          ) : (
            <p className="text-sm text-gray-500">Select a patient.</p>
          )}
        </div>
      </div>
    </div>
  );
}
