import { useEffect, useState } from "react";
import { AppointmentList } from "../../../components/AppointmentList";
import { PatientChart } from "../../../components/PatientChart";
import { getTodaysAppointments, roomPatient } from "../../../services/nursingApi";
import type { Appointment } from "../../../types";

// Nursing Assistant page: only patients the receptionist has checked in.
// NAs put the patient in an exam room, take vitals and add notes. They
// can't give medications, so PatientChart hides that button for NAs.
export function NAPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [room, setRoom] = useState("");
  const [error, setError] = useState("");
  // Bumped after rooming a patient to reload the list (re-runs the effect).
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    async function loadAppointments() {
      try {
        setAppointments(await getTodaysAppointments());
      } catch {
        setError("Could not load today's appointments.");
      }
    }
    loadAppointments();
  }, [reloadCount]);

  const checkedIn = appointments.filter((a) => a.status === "Checked In");
  const selected = appointments.find((a) => a.appointmentId === selectedId);

  async function handleRoom() {
    if (!selected || !room.trim()) return;
    try {
      await roomPatient(selected.appointmentId, room.trim());
      setRoom("");
      setReloadCount((n) => n + 1); // refresh so the new room shows up
    } catch {
      alert("Could not save the room. Please try again.");
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">NA Workspace</h1>
      <p className="mt-1 text-sm text-gray-500">
        Room checked-in patients, take vitals and add notes.
      </p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid gap-6 md:grid-cols-[18rem_1fr]">
        <AppointmentList
          appointments={checkedIn}
          selectedId={selectedId}
          onSelect={(a) => setSelectedId(a.appointmentId)}
        />
        <div className="rounded border border-gray-200 bg-white p-4">
          {selected ? (
            <>
              <div className="mb-6 flex items-end gap-2">
                <label className="text-sm text-gray-700">
                  Exam room
                  <input
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder={selected.roomNumber ?? "e.g. 3"}
                    className="mt-1 block w-28 rounded border border-gray-300 px-2 py-1"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleRoom}
                  className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
                >
                  {selected.roomNumber ? "Change room" : "Room patient"}
                </button>
              </div>
              <PatientChart patientId={selected.patientId} role="NA" appointment={selected} />
            </>
          ) : (
            <p className="text-sm text-gray-500">Select a patient.</p>
          )}
        </div>
      </div>
    </div>
  );
}
