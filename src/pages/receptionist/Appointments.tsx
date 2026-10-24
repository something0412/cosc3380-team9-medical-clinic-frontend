import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { ErrorText, Field, SelectField } from "../../components/FormControls";
import { Modal } from "../../components/Modal";
import { FormActions, PrimaryButton, StatusBadge, SuccessText, TextButton } from "../../components/ProfileUI";
import { formatId } from "../../utils/id";

interface Appointment {
  appointmentId: number;
  patientId: number;
  patientName: string;
  phone: string;
  date: string;
  time: string;
  doctorName: string;
  specialty: string;
  status: string;
  bookingChannel: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  hasInvoice: boolean;
}

interface DayData {
  officeId: number;
  officeName: string;
  today: string;
  appointments: Appointment[];
}

interface PatientOption {
  patientId: number;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

interface Doctor {
  doctorId: number;
  firstName: string;
  lastName: string;
  specialties: { specialtyId: number; name: string }[];
  offices: { officeId: number; name: string }[];
}

interface TimeSlot {
  date: string;
  doctorId: number;
  specialtyId: number;
  specialty: string;
  requiresReferral: boolean;
  referralId: number | null;
  timeSlotId: number;
  startTime: string;
  endTime: string;
}

export function ReceptionistAppointments() {
  const [date, setDate] = useState("");
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  // load the day's appointments at my office
  useEffect(() => {
    async function loadAppointments() {
      try {
        const res = await api.get<DayData>("/api/receptionist/appointments", { params: { date: date || undefined, search } });
        setData(res.data);
        setError("");
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadAppointments();
  }, [date, search, reloadCount]);

  // search by patient name
  function handleSearch(e: FormEvent) {
    e.preventDefault();
    setSearch(searchText);
  }

  // check in, check out, no show or cancel one appointment
  async function updateAppointment(appointmentId: number, action: string, label: string) {
    if (action === "cancel" && !window.confirm("Cancel this appointment?")) return;
    if (action === "no-show" && !window.confirm("Mark this patient as No Show?")) return;
    setError("");
    setMessage("");
    setBusyId(appointmentId);
    try {
      if (action === "cancel") {
        await api.patch(`/api/appointments/${appointmentId}/cancel`);
      } else {
        await api.patch(`/api/receptionist/appointments/${appointmentId}/${action}`);
      }
      setMessage(label);
      setReloadCount(reloadCount + 1);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  const today = data?.today ?? "";
  const shownDate = date || today;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="mt-1 text-gray-600">Book, cancel and check in appointments at {data?.officeName || "your office"}.</p>
        </div>
        <PrimaryButton type="button" onClick={() => setShowBooking(true)}>+ Book Appointment</PrimaryButton>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Date</span>
          <input
            type="date"
            value={shownDate}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          />
        </label>
        {date && date !== today && (
          <button type="button" onClick={() => setDate("")} className="pb-2 text-sm text-blue-600 hover:underline">
            Back to today
          </button>
        )}

        <form onSubmit={handleSearch} className="flex max-w-md flex-1 gap-2">
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by patient name"
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearchText("");
                setSearch("");
              }}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      <SuccessText message={message} />

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full whitespace-nowrap text-left text-sm">
          <thead className="bg-gray-50">
            <tr className="border-b text-gray-500">
              <th className="p-3 font-medium">Time</th>
              <th className="p-3 font-medium">Patient</th>
              <th className="p-3 font-medium">Phone</th>
              <th className="p-3 font-medium">Doctor</th>
              <th className="p-3 font-medium">Specialty</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Checked In</th>
              <th className="p-3 font-medium">Checked Out</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="p-3 text-gray-500">Loading appointments...</td></tr>
            ) : !data || data.appointments.length === 0 ? (
              <tr><td colSpan={9} className="p-3 text-gray-500">{search ? `No appointments for "${search}" on ${shownDate}.` : `No appointments on ${shownDate}.`}</td></tr>
            ) : (
              data.appointments.map((a) => {
                const isScheduled = a.status === "Scheduled";
                const canCheckIn = isScheduled && a.date === today && !a.checkedInAt;
                const canCheckOut = a.date === today && a.checkedInAt && !a.checkedOutAt && a.status !== "Cancelled" && a.status !== "No Show";
                const canNoShow = isScheduled && a.date <= today && !a.checkedInAt;
                const canCancel = isScheduled && a.date >= today && !a.checkedInAt;
                const busy = busyId === a.appointmentId;
                return (
                  <tr key={a.appointmentId} className="border-b last:border-0">
                    <td className="p-3">{a.time}</td>
                    <td className="p-3">
                      <Link to={`/staff/reception/patients/${a.patientId}`} className="font-medium text-blue-600 hover:underline">
                        {a.patientName}
                      </Link>
                      {a.bookingChannel === "Phone" && (
                        <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Phone</span>
                      )}
                    </td>
                    <td className="p-3">{a.phone}</td>
                    <td className="p-3">{a.doctorName}</td>
                    <td className="p-3">{a.specialty}</td>
                    <td className="p-3"><StatusBadge status={a.status} /></td>
                    <td className="p-3">{a.checkedInAt ?? "—"}</td>
                    <td className="p-3">{a.checkedOutAt ?? "—"}</td>
                    <td className="space-x-3 p-3">
                      {canCheckIn && (
                        <TextButton disabled={busy} onClick={() => updateAppointment(a.appointmentId, "check-in", `${a.patientName} is checked in.`)}>
                          Check In
                        </TextButton>
                      )}
                      {canCheckOut && (
                        <TextButton disabled={busy} onClick={() => updateAppointment(a.appointmentId, "check-out", `${a.patientName} is checked out.`)}>
                          Check Out
                        </TextButton>
                      )}
                      {canNoShow && (
                        <TextButton disabled={busy} onClick={() => updateAppointment(a.appointmentId, "no-show", `${a.patientName} was marked No Show.`)}>
                          No Show
                        </TextButton>
                      )}
                      {canCancel && (
                        <TextButton danger disabled={busy} onClick={() => updateAppointment(a.appointmentId, "cancel", "The appointment was cancelled.")}>
                          Cancel
                        </TextButton>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showBooking && data && (
        <BookingModal
          officeId={data.officeId}
          today={today}
          onClose={() => setShowBooking(false)}
          onBooked={(bookedDate) => {
            setMessage("The appointment was booked.");
            setDate(bookedDate);
            setReloadCount(reloadCount + 1);
          }}
        />
      )}
    </div>
  );
}

function BookingModal({ officeId, today, onClose, onBooked }: { officeId: number; today: string; onClose: () => void; onBooked: (date: string) => void }) {
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(today);
  const [times, setTimes] = useState<TimeSlot[]>([]);
  const [timeSlotId, setTimeSlotId] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // load patients and the doctors who work at my office
  useEffect(() => {
    async function loadOptions() {
      try {
        const patientsRes = await api.get<PatientOption[]>("/api/patients");
        setPatients(patientsRes.data.filter((p) => p.isActive).sort((a, b) => a.lastName.localeCompare(b.lastName)));
        const doctorsRes = await api.get<Doctor[]>("/api/public/doctors");
        setDoctors(doctorsRes.data.filter((d) => d.offices.some((o) => o.officeId === officeId)));
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    loadOptions();
  }, [officeId]);

  // load open times when the patient, doctor or date changes
  useEffect(() => {
    async function loadTimes() {
      setChecking(true);
      setTimes([]);
      setError("");
      try {
        const res = await api.get<TimeSlot[]>("/api/availability", { params: { doctorId, date, patientId } });
        setTimes(res.data);
      } catch (err) {
        setTimes([]);
        setError(apiErrorMessage(err));
      } finally {
        setChecking(false);
      }
    }
    if (!patientId || !doctorId || !date) return;
    loadTimes();
  }, [patientId, doctorId, date]);

  // specialists need an approved referral before any time can be booked
  const needsReferral = times.length > 0 && times.every((t) => t.requiresReferral && !t.referralId);
  const openTimes = times.filter((t) => !t.requiresReferral || t.referralId);
  const selectedSlot = openTimes.find((t) => String(t.timeSlotId) === timeSlotId);

  // book the appointment
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    setError("");
    setSaving(true);
    try {
      await api.post("/api/appointments", {
        patientId: Number(patientId),
        doctorId: Number(doctorId),
        specialtyId: selectedSlot.specialtyId,
        date,
        timeSlotId: selectedSlot.timeSlotId,
        referralId: selectedSlot.referralId,
      });
      onBooked(date);
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Book Appointment" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectField label="Patient" required value={patientId} onChange={(e) => { setPatientId(e.target.value); setTimeSlotId(""); }}>
          <option value="">Select a patient</option>
          {patients.map((p) => (
            <option key={p.patientId} value={p.patientId}>
              {p.lastName}, {p.firstName} ({formatId(p.patientId)})
            </option>
          ))}
        </SelectField>

        <SelectField label="Doctor" required value={doctorId} onChange={(e) => { setDoctorId(e.target.value); setTimeSlotId(""); }}>
          <option value="">Select a doctor</option>
          {doctors.map((d) => (
            <option key={d.doctorId} value={d.doctorId}>
              Dr. {d.firstName} {d.lastName} · {d.specialties.map((s) => s.name).join(", ")}
            </option>
          ))}
        </SelectField>

        <Field label="Date" type="date" required min={today} value={date} onChange={(e) => { setDate(e.target.value); setTimeSlotId(""); }} />

        {patientId && doctorId && date && (
          <div>
            <span className="mb-1 block text-sm font-medium text-gray-700">Open Times</span>
            {checking ? (
              <p className="text-sm text-gray-500">Checking open times...</p>
            ) : needsReferral ? (
              <p className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
                {times[0].specialty} is a specialty. This patient needs an approved referral to this doctor before an appointment can be booked.
              </p>
            ) : openTimes.length === 0 ? (
              <p className="text-sm text-gray-500">No open times on this date. Try another date.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {openTimes.map((t) => (
                  <button
                    key={t.timeSlotId}
                    type="button"
                    onClick={() => setTimeSlotId(String(t.timeSlotId))}
                    className={`rounded-lg border px-3 py-1.5 text-sm ${
                      String(t.timeSlotId) === timeSlotId
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {t.startTime}
                  </button>
                ))}
              </div>
            )}
            {selectedSlot?.referralId && <p className="mt-2 text-sm text-gray-600">Uses the patient's approved referral.</p>}
          </div>
        )}

        <ErrorText message={error} />
        {selectedSlot ? (
          <FormActions saving={saving} onCancel={onClose} saveLabel={`Book ${date} at ${selectedSlot.startTime}`} />
        ) : (
          <p className="text-sm text-gray-500">Choose a patient, doctor, date and time.</p>
        )}
      </form>
    </Modal>
  );
}
