import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../api";
import type { CreatePatientRequest, Patient } from "../../types";

type Appointment = {
  id: number;
  patient: string;
  doctor: string;
  date: string;
  time: string;
  status: "Scheduled" | "Checked in" | "Checked out";
};

// Empty registration form. Used to start the form and to clear it after saving.
const EMPTY_PATIENT: CreatePatientRequest = {
  firstName: "",
  lastName: "",
  dob: "",
  gender: "",
  phone: "",
  email: "",
  address: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  insuranceProvider: "",
  insurancePolicyNumber: "",
};

// The text inputs on the registration form. Gender is a dropdown, so it's
// written out separately below. No SSN on purpose: insurance identifies the
// patient, and SSNs are too risky to store.
const REGISTER_FIELDS: {
  field: keyof CreatePatientRequest;
  label: string;
  type?: string;
  required?: boolean;
}[] = [
  { field: "firstName", label: "First name", required: true },
  { field: "lastName", label: "Last name", required: true },
  { field: "dob", label: "Date of birth", type: "date", required: true },
  { field: "phone", label: "Phone", type: "tel", required: true },
  { field: "email", label: "Email", type: "email" },
  { field: "address", label: "Address", required: true },
  { field: "emergencyContactName", label: "Emergency contact name" },
  { field: "emergencyContactPhone", label: "Emergency contact phone", type: "tel" },
  { field: "insuranceProvider", label: "Insurance provider" },
  { field: "insurancePolicyNumber", label: "Insurance policy number" },
];

// Same switch as the nursing pages: with VITE_USE_MOCK_DATA=true in
// .env.local, new patients are only kept on this page instead of being
// sent to the backend.
const USE_MOCKS = import.meta.env.VITE_USE_MOCK_DATA === "true";

export function StaffAppointment() {
  // --- Patient registration ---
  const [patients, setPatients] = useState<Patient[]>([]);
  const [newPatient, setNewPatient] = useState<CreatePatientRequest>(EMPTY_PATIENT);
  const [registerMessage, setRegisterMessage] = useState("");

  // --- Appointments ---
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patient, setPatient] = useState("");
  const [doctor, setDoctor] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // Load existing patients so returning patients show up in the
  // appointment dropdown without registering again.
  useEffect(() => {
    async function loadPatients() {
      if (USE_MOCKS) return;
      try {
        const response = await api.get<Patient[]>("/api/patients");
        setPatients(response.data);
      } catch {
        setRegisterMessage("Could not load existing patients.");
      }
    }
    loadPatients();
  }, []);

  // Updates one field of the registration form, e.g. updateField("phone", "713...").
  function updateField(field: keyof CreatePatientRequest, value: string) {
    setNewPatient({ ...newPatient, [field]: value });
  }

  async function registerPatient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      let saved: Patient;
      if (USE_MOCKS) {
        // No backend: make the patient record here.
        saved = {
          patientId: Date.now(),
          firstName: newPatient.firstName,
          lastName: newPatient.lastName,
          dob: newPatient.dob,
          phone: newPatient.phone,
          email: newPatient.email || null,
          isActive: true,
        };
      } else {
        // POST /api/patients — backend route still needs to be built.
        const response = await api.post<Patient>("/api/patients", newPatient);
        saved = response.data;
      }

      setPatients([...patients, saved]);
      // Pick the new patient in the appointment form so the receptionist
      // can schedule them right away.
      setPatient(`${saved.firstName} ${saved.lastName}`);
      setNewPatient(EMPTY_PATIENT);
      setRegisterMessage(`Registered ${saved.firstName} ${saved.lastName}.`);
    } catch {
      setRegisterMessage("Could not register patient. Please try again.");
    }
  }

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
        Register new patients, schedule visits and manage check-ins.
      </p>

      {/* Step 1: register a new patient (skip for returning patients) */}
      <h2 className="mt-6 text-lg font-medium text-gray-900">Register patient</h2>
      <form
        onSubmit={registerPatient}
        className="my-3 grid gap-3 rounded border border-gray-200 bg-white p-4 sm:grid-cols-2"
      >
        {REGISTER_FIELDS.map((f) => (
          <label key={f.field} className="text-sm">
            {f.label}
            <input
              required={f.required}
              type={f.type ?? "text"}
              value={newPatient[f.field]}
              onChange={(event) => updateField(f.field, event.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
        ))}

        <label className="text-sm">
          Gender
          <select
            required
            value={newPatient.gender}
            onChange={(event) => updateField("gender", event.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          >
            <option value="">Select…</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </select>
        </label>

        <button
          type="submit"
          className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 sm:col-span-2"
        >
          Register patient
        </button>
        {registerMessage && (
          <p className="text-sm text-gray-600 sm:col-span-2">{registerMessage}</p>
        )}
      </form>

      {/* Step 2: schedule the visit */}
      <h2 className="mt-6 text-lg font-medium text-gray-900">Schedule appointment</h2>
      <form
        onSubmit={addAppointment}
        className="my-3 grid gap-3 rounded border border-gray-200 bg-white p-4 sm:grid-cols-2"
      >
        <label className="text-sm">
          Patient
          <select
            required
            value={patient}
            onChange={(event) => setPatient(event.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          >
            <option value="">Select a patient…</option>
            {patients.map((p) => (
              <option key={p.patientId} value={`${p.firstName} ${p.lastName}`}>
                {p.firstName} {p.lastName}
              </option>
            ))}
          </select>
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

      {/* Step 3: check patients in when they arrive, out when they leave */}
      <h2 className="mb-3 text-lg font-medium text-gray-900">Check in / check out</h2>
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
