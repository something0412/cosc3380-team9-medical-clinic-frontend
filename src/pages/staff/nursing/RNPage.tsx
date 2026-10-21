import { useEffect, useState } from "react";
import { AppointmentList } from "../../../components/AppointmentList";
import { PatientChart } from "../../../components/PatientChart";
import { useAuth } from "../../../context/AuthContext";
import { getTodaysAppointments } from "../../../services/nursingApi";
import type { Appointment } from "../../../types";

// Clinical Queue (nurses): today's patients at the nurse's office on the
// left, the selected patient's chart on the right, where the nurse
// records vitals, allergies, home medications, notes and labs.
export function RNPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState("");
  // Bumping this re-runs the effect below (the Refresh button), e.g. to
  // see patients the front desk has just checked in.
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let ignore = false;
    getTodaysAppointments(user?.officeId)
      .then((data) => {
        if (!ignore) {
          // Cancelled visits and no-shows aren't coming in.
          setAppointments(data.filter((a) => a.status !== "Cancelled" && a.status !== "No Show"));
          setError("");
        }
      })
      .catch(() => {
        if (!ignore) setError("Could not load today's appointments.");
      });
    return () => {
      ignore = true;
    };
  }, [user?.officeId, reloadCount]);

  const selected = appointments.find((a) => a.appointmentId === selectedId);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Clinical Queue</h1>
          <p className="mt-1 text-sm text-gray-500">Today's patients at your office.</p>
        </div>
        <button
          type="button"
          onClick={() => setReloadCount((n) => n + 1)}
          className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid gap-6 md:grid-cols-[18rem_1fr]">
        <AppointmentList
          appointments={appointments}
          selectedId={selectedId}
          onSelect={(a) => setSelectedId(a.appointmentId)}
        />
        <div className="rounded border border-gray-200 bg-white p-4">
          {selected ? (
            // key: a fresh chart per visit, so one patient's half-filled
            // forms never show under another's name.
            <PatientChart key={selected.appointmentId} patientId={selected.patientId} canEdit appointment={selected} />
          ) : (
            <p className="text-sm text-gray-500">Select a patient.</p>
          )}
        </div>
      </div>
    </div>
  );
}
