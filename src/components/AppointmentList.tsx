import type { Appointment } from "../types";
import { timeOf } from "../utils/dates";

// Today's appointments as a clickable list, for the nurse's Clinical
// Queue. Each shows where the patient is (set by the receptionist's
// check-in and the nurse's notes) and flags severe allergies.
export function AppointmentList({
  appointments,
  selectedId,
  onSelect,
}: {
  appointments: Appointment[];
  selectedId: number | null;
  onSelect: (appointment: Appointment) => void;
}) {
  if (appointments.length === 0) {
    return <p className="text-sm text-gray-500">No patients today.</p>;
  }

  return (
    <ul className="space-y-2">
      {appointments.map((a) => (
        <li key={a.appointmentId}>
          <button
            type="button"
            onClick={() => onSelect(a)}
            className={`w-full rounded border p-3 text-left ${
              a.appointmentId === selectedId
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white hover:bg-gray-50"
            }`}
          >
            <p className="font-medium text-gray-900">{a.patientName}</p>
            <p className="text-sm text-gray-600">
              {timeOf(a.scheduledAt)} · {a.specialty} · {a.doctorName}
            </p>
            <p className={`text-sm ${a.visitState === "Waiting" ? "font-medium text-green-700" : "text-gray-500"}`}>
              {queueStatus(a)}
            </p>
            {a.hasSevereAllergy && <p className="text-sm font-semibold text-red-700">Severe allergy</p>}
          </button>
        </li>
      ))}
    </ul>
  );
}

// "Waiting · checked in at 9:02 AM", "With nurse", "Done" or "Not here yet".
function queueStatus(a: Appointment) {
  if (a.visitState === "Waiting") return `Waiting · checked in at ${timeOf(a.checkedInAt!)}`;
  if (a.visitState === "Expected") return "Not checked in yet";
  return a.visitState;
}
