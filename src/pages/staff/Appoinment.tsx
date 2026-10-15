import { useState } from "react";
import type { FormEvent } from "react";

type Appointment = {
  id: number;
  patient: string;
  doctor: string;
  date: string;
  time: string;
  status: "Scheduled" | "Checked in" | "Checked out";
};

export function StaffAppointment() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patient, setPatient] = useState("");
  const [doctor, setDoctor] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  function addAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const newAppointment: Appointment = {
      id: Date.now(),
      patient,
      doctor,
      date,
      time,
      status: "Scheduled",
    };

    setAppointments([...appointments, newAppointment]);
    setPatient("");
    setDoctor("");
    setDate("");
    setTime("");
  }

  function updateStatus(id: number, status: Appointment["status"]) {
    setAppointments(
      appointments.map((appointment) =>
        appointment.id === id ? { ...appointment, status } : appointment,
      ),
    );
  }

  return (
    <main>
      <h1 className="text-xl font-semibold text-gray-900">
        Patient Appointments
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Schedule visits and manage patient check-ins.
      </p>

      <form
        onSubmit={addAppointment}
        className="my-6 grid gap-3 rounded border border-gray-200 bg-white p-4 sm:grid-cols-2"
      >
        <label className="text-sm">
          Patient name
          <input
            required
            value={patient}
            onChange={(event) => setPatient(event.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="text-sm">
          Doctor
          <input
            required
            value={doctor}
            onChange={(event) => setDoctor(event.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="text-sm">
          Date
          <input
            required
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="text-sm">
          Time
          <input
            required
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>

        <button
          type="submit"
          className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 sm:col-span-2"
        >
          Add appointment
        </button>
      </form>

      <h2 className="mb-3 text-lg font-medium text-gray-900">Schedule</h2>
      <div className="space-y-3">
        {appointments.length === 0 ? (
          <p className="text-sm text-gray-500">No appointments scheduled.</p>
        ) : (
          appointments.map((appointment) => (
            <article
              key={appointment.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded border border-gray-200 bg-white p-4"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {appointment.time} — {appointment.patient}
                </p>
                <p className="text-sm text-gray-600">
                  {appointment.date} · Dr. {appointment.doctor}
                </p>
                <p className="text-sm text-gray-600">{appointment.status}</p>
              </div>

              <div className="flex gap-3">
                {appointment.status === "Scheduled" && (
                  <button
                    type="button"
                    onClick={() => updateStatus(appointment.id, "Checked in")}
                    className="text-sm font-medium text-blue-700 hover:underline"
                  >
                    Check in
                  </button>
                )}
                {appointment.status === "Checked in" && (
                  <button
                    type="button"
                    onClick={() => updateStatus(appointment.id, "Checked out")}
                    className="text-sm font-medium text-blue-700 hover:underline"
                  >
                    Check out
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </main>
  );
}
