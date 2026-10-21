import { useEffect, useState } from "react";
import { AppointmentList } from "../../../components/AppointmentList";
import { PatientChart } from "../../../components/PatientChart";
import { getTodaysAppointments } from "../../../services/nursingApi";
import type { Appointment } from "../../../types";

// Registered Nurse page: today's patients on the left, the selected
// patient's chart on the right. RNs can record vitals there (inside
// PatientChart).
export function RNPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAppointments() {
      try {
        setAppointments(await getTodaysAppointments());
      } catch {
        setError("Could not load today's appointments.");
      }
    }
    loadAppointments();
  }, []);

  const selected = appointments.find((a) => a.appointmentId === selectedId);

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">RN Workspace</h1>
      <p className="mt-1 text-sm text-gray-500">
        Check allergies and medications and record vitals for today's patients.
      </p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid gap-6 md:grid-cols-[18rem_1fr]">
        <AppointmentList
          appointments={appointments}
          selectedId={selectedId}
          onSelect={(a) => setSelectedId(a.appointmentId)}
        />
        <div className="rounded border border-gray-200 bg-white p-4">
          {selected ? (
            <PatientChart patientId={selected.patientId} canRecordVitals appointment={selected} />
          ) : (
            <p className="text-sm text-gray-500">Select a patient.</p>
          )}
        </div>
      </div>
    </div>
  );
}
