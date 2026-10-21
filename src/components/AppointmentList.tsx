import type { Appointment } from "../types";

// Today's appointments as a clickable list. Used on the left side of the
// RN page.
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
    return <p className="text-sm text-gray-500">No patients right now.</p>;
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
              {new Date(a.scheduledAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              {" · "}
              {a.doctorName}
            </p>
            {/* Check-in comes from the receptionist. */}
            <p className={`text-sm ${a.checkedInAt && !a.checkedOutAt ? "font-medium text-green-700" : "text-gray-500"}`}>
              {a.specialty} · {a.checkedOutAt ? "Checked out" : a.checkedInAt ? "Checked in" : a.status}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}
