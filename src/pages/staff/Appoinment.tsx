import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { authErrorMessage } from "../../services/authApi";
import {
  bookAppointment,
  getAppointments,
  getAvailability,
  getDoctors,
  registerPatient,
  updateVisit,
} from "../../services/frontDeskApi";
import { getPatients } from "../../services/nursingApi";
import type { Appointment, AvailableSlot, Doctor, Patient } from "../../types";

// The registration form's fields, kept flat while typing; turned into the
// nested CreatePatientRequest on submit.
type RegisterForm = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  ecFirstName: string;
  ecLastName: string;
  ecRelationship: string;
  ecPhone: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
};

// Empty registration form. Used to start the form and to clear it after saving.
const EMPTY_PATIENT: RegisterForm = {
  firstName: "",
  lastName: "",
  dob: "",
  gender: "",
  phone: "",
  email: "",
  address: "",
  ecFirstName: "",
  ecLastName: "",
  ecRelationship: "",
  ecPhone: "",
  insuranceProvider: "",
  insurancePolicyNumber: "",
};

// The text inputs on the registration form. Gender is a dropdown, so it's
// written out separately below. No SSN on purpose: insurance identifies the
// patient, and SSNs are too risky to store.
const REGISTER_FIELDS: {
  field: keyof RegisterForm;
  label: string;
  type?: string;
  required?: boolean;
}[] = [
  { field: "firstName", label: "First name", required: true },
  { field: "lastName", label: "Last name", required: true },
  { field: "dob", label: "Date of birth", type: "date", required: true },
  { field: "phone", label: "Phone", type: "tel", required: true },
  { field: "email", label: "Email", type: "email" },
  { field: "address", label: "Address" },
  { field: "ecFirstName", label: "Emergency contact first name" },
  { field: "ecLastName", label: "Emergency contact last name" },
  { field: "ecRelationship", label: "Emergency contact relationship" },
  { field: "ecPhone", label: "Emergency contact phone", type: "tel" },
  { field: "insuranceProvider", label: "Insurance provider" },
  { field: "insurancePolicyNumber", label: "Insurance policy number" },
];

// "en-CA" formats as YYYY-MM-DD in local time.
const today = () => new Date().toLocaleDateString("en-CA");

export function StaffAppointment() {
  const { user } = useAuth();
  const employeeId = user?.id ?? 0;

  // --- Patient registration ---
  const [patients, setPatients] = useState<Patient[]>([]);
  const [newPatient, setNewPatient] = useState<RegisterForm>(EMPTY_PATIENT);
  const [registerMessage, setRegisterMessage] = useState("");

  // --- Scheduling ---
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [timeSlotId, setTimeSlotId] = useState("");
  const [referralId, setReferralId] = useState("");
  const [scheduleMessage, setScheduleMessage] = useState("");

  // --- Check in / check out ---
  const [listDate, setListDate] = useState(today());
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Load existing patients and doctors once, for the dropdowns.
  useEffect(() => {
    async function loadLists() {
      try {
        const [patientList, doctorList] = await Promise.all([getPatients(), getDoctors()]);
        setPatients(patientList);
        setDoctors(doctorList);
      } catch {
        setRegisterMessage("Could not load patients and doctors.");
      }
    }
    loadLists();
  }, []);

  // Changing the doctor or date makes the old slot list wrong, so clear
  // it right away; the effect below fetches the new one.
  function changeDoctor(value: string) {
    setDoctorId(value);
    setSlots([]);
    setTimeSlotId("");
  }

  function changeDate(value: string) {
    setDate(value);
    setSlots([]);
    setTimeSlotId("");
  }

  // Open slots for the chosen doctor and day; re-fetched when either changes.
  useEffect(() => {
    if (!doctorId || !date) return;
    let ignore = false;
    getAvailability(Number(doctorId), date)
      .then((data) => !ignore && setSlots(data))
      .catch(() => !ignore && setScheduleMessage("Could not load open time slots."));
    return () => {
      ignore = true;
    };
  }, [doctorId, date]);

  // The day's appointments for the check-in list.
  useEffect(() => {
    let ignore = false;
    getAppointments(listDate)
      .then((data) => !ignore && setAppointments(data))
      .catch(() => !ignore && setAppointments([]));
    return () => {
      ignore = true;
    };
  }, [listDate]);

  // Updates one field of the registration form, e.g. updateField("phone", "713...").
  function updateField(field: keyof RegisterForm, value: string) {
    setNewPatient({ ...newPatient, [field]: value });
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const p = newPatient;

    // Emergency contact and insurance are optional, but all-or-nothing.
    const ec = [p.ecFirstName, p.ecLastName, p.ecRelationship, p.ecPhone];
    const ins = [p.insuranceProvider, p.insurancePolicyNumber];
    if (ec.some(Boolean) && !ec.every(Boolean)) {
      setRegisterMessage("Fill in all emergency contact fields, or leave them all blank.");
      return;
    }
    if (ins.some(Boolean) && !ins.every(Boolean)) {
      setRegisterMessage("Fill in both insurance fields, or leave them both blank.");
      return;
    }

    try {
      const saved = await registerPatient(employeeId, {
        firstName: p.firstName,
        lastName: p.lastName,
        dob: p.dob,
        gender: p.gender,
        phone: p.phone,
        email: p.email,
        address: p.address,
        emergencyContact: ec.every(Boolean)
          ? { firstName: p.ecFirstName, lastName: p.ecLastName, relationship: p.ecRelationship, phone: p.ecPhone }
          : null,
        insurance: ins.every(Boolean) ? { provider: p.insuranceProvider, policyNumber: p.insurancePolicyNumber } : null,
      });

      setPatients([...patients, saved]);
      // Pick the new patient in the appointment form so the receptionist
      // can schedule them right away.
      setPatientId(String(saved.patientId));
      setNewPatient(EMPTY_PATIENT);
      setRegisterMessage(`Registered ${saved.firstName} ${saved.lastName} (patient #${saved.patientId}).`);
    } catch (err) {
      setRegisterMessage(`Could not register patient: ${authErrorMessage(err)}`);
    }
  }

  const selectedSlot = slots.find((s) => String(s.timeSlotId) === timeSlotId);

  async function handleSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const booked = await bookAppointment(employeeId, {
        patientId: Number(patientId),
        doctorId: Number(doctorId),
        date,
        timeSlotId: Number(timeSlotId),
        referralId: referralId ? Number(referralId) : null,
      });
      setScheduleMessage(`Booked ${booked.patientName} with ${booked.doctorName} on ${booked.scheduledAt.replace("T", " at ").slice(0, -3)}.`);
      // The slot is taken now: drop it from the list.
      setSlots(slots.filter((s) => String(s.timeSlotId) !== timeSlotId));
      setTimeSlotId("");
      setReferralId("");
      if (date === listDate) setAppointments([...appointments, booked]);
    } catch (err) {
      setScheduleMessage(`Could not book appointment: ${authErrorMessage(err)}`);
    }
  }

  async function handleVisit(appointmentId: number, action: "check-in" | "check-out") {
    try {
      const updated = await updateVisit(employeeId, appointmentId, action);
      setAppointments(appointments.map((a) => (a.appointmentId === appointmentId ? updated : a)));
    } catch (err) {
      alert(`Could not ${action.replace("-", " ")}: ${authErrorMessage(err)}`);
    }
  }

  const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

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
        onSubmit={handleRegister}
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
        onSubmit={handleSchedule}
        className="my-3 grid gap-3 rounded border border-gray-200 bg-white p-4 sm:grid-cols-2"
      >
        <label className="text-sm">
          Patient
          <select
            required
            value={patientId}
            onChange={(event) => setPatientId(event.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          >
            <option value="">Select a patient…</option>
            {patients.map((p) => (
              <option key={p.patientId} value={p.patientId}>
                {p.lastName}, {p.firstName} (#{p.patientId})
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Doctor
          <select
            required
            value={doctorId}
            onChange={(event) => changeDoctor(event.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          >
            <option value="">Select a doctor…</option>
            {doctors.map((d) => (
              <option key={d.doctorId} value={d.doctorId}>
                {d.name}{d.specialties && ` — ${d.specialties}`}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Date
          <input
            required
            type="date"
            min={today()}
            value={date}
            onChange={(event) => changeDate(event.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="text-sm">
          Time
          <select
            required
            value={timeSlotId}
            onChange={(event) => setTimeSlotId(event.target.value)}
            disabled={!doctorId || !date}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 disabled:bg-gray-100"
          >
            <option value="">
              {!doctorId || !date ? "Pick a doctor and date first" : slots.length ? "Select a time…" : "No open slots that day"}
            </option>
            {slots.map((s) => (
              <option key={s.timeSlotId} value={s.timeSlotId}>
                {s.startTime}–{s.endTime} · {s.specialty} · {s.office}
              </option>
            ))}
          </select>
        </label>

        {/* Only some specialties (e.g. cardiology) need a referral. */}
        {selectedSlot?.requiresReferral && (
          <label className="text-sm sm:col-span-2">
            Referral number (required for {selectedSlot.specialty})
            <input
              required
              type="number"
              min="1"
              value={referralId}
              onChange={(event) => setReferralId(event.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
        )}

        <button
          type="submit"
          className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 sm:col-span-2"
        >
          Add appointment
        </button>
        {scheduleMessage && (
          <p className="text-sm text-gray-600 sm:col-span-2">{scheduleMessage}</p>
        )}
      </form>

      {/* Step 3: check patients in when they arrive, out when they leave */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-gray-900">Check in / check out</h2>
        <input
          type="date"
          value={listDate}
          onChange={(event) => setListDate(event.target.value)}
          className="rounded border border-gray-300 px-3 py-1 text-sm"
        />
      </div>
      <div className="space-y-3">
        {appointments.length === 0 ? (
          <p className="text-sm text-gray-500">No appointments scheduled.</p>
        ) : (
          appointments.map((appointment) => (
            <article
              key={appointment.appointmentId}
              className="flex flex-wrap items-center justify-between gap-3 rounded border border-gray-200 bg-white p-4"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {time(appointment.scheduledAt)} — {appointment.patientName}
                </p>
                <p className="text-sm text-gray-600">
                  {appointment.specialty} · {appointment.doctorName}
                </p>
                <p className="text-sm text-gray-600">
                  {appointment.checkedOutAt
                    ? `Checked out at ${time(appointment.checkedOutAt)}`
                    : appointment.checkedInAt
                      ? `Checked in at ${time(appointment.checkedInAt)}`
                      : appointment.status}
                </p>
              </div>

              <div className="flex gap-3">
                {/* Check-in only on the day of the visit (the backend enforces this too). */}
                {appointment.status === "Scheduled" && !appointment.checkedInAt && listDate === today() && (
                  <button
                    type="button"
                    onClick={() => handleVisit(appointment.appointmentId, "check-in")}
                    className="text-sm font-medium text-blue-700 hover:underline"
                  >
                    Check in
                  </button>
                )}
                {appointment.checkedInAt && !appointment.checkedOutAt && (
                  <button
                    type="button"
                    onClick={() => handleVisit(appointment.appointmentId, "check-out")}
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
