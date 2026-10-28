import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { ADMIN_PRIMARY_BUTTON, ADMIN_SECONDARY_BUTTON } from "../../components/admin/styles";
import { ErrorText, Field, SelectField } from "../../components/FormControls";
import { Modal } from "../../components/Modal";
import { PageError, PortalPage } from "../../components/PortalPage";
import { FormActions, NotAvailable, StatusBadge, SuccessText, TextButton, WarningBox } from "../../components/ProfileUI";
import { formatId } from "../../utils/id";

interface Appointment {
  appointmentId: number;
  patientId: number;
  patientName: string;
  date: string;
  startTime: string;
  doctorName: string;
  specialty: string;
  status: string;
  bookingChannel: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  checkedOutAt: string | null;
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
  available?: boolean;
  unavailableReason?: string | null;
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
    <PortalPage
      eyebrow="Front Desk"
      title="Appointments"
      description={`Book, cancel, check in and check out appointments at ${data?.officeName || "your office"}.`}
      actions={
        <button type="button" onClick={() => setShowBooking(true)} className={ADMIN_PRIMARY_BUTTON}>
          Book Appointment
        </button>
      }
    >
      <form onSubmit={handleSearch} className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_2fr_auto_auto] sm:items-end">
        <Field label="Date" type="date" value={shownDate} onChange={(e) => setDate(e.target.value)} />
        <Field label="Patient" type="search" placeholder="Patient name" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        <button type="submit" className={ADMIN_PRIMARY_BUTTON}>Search</button>
        {(search || (date && date !== today)) && (
          <button
            type="button"
            onClick={() => {
              setSearchText("");
              setSearch("");
              setDate("");
            }}
            className={ADMIN_SECONDARY_BUTTON}
          >
            Back to today
          </button>
        )}
      </form>

      <PageError message={error} />
      <SuccessText message={message} />

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Specialty</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Checked In</th>
                <th className="px-4 py-3">Checked Out</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500">Loading appointments...</td></tr>
              ) : !data || data.appointments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    {search ? `No appointments for "${search}" on ${shownDate}.` : `No appointments on ${shownDate}.`}
                  </td>
                </tr>
              ) : (
                data.appointments.map((a) => {
                  const isScheduled = a.status === "Scheduled";
                  const canCheckIn = isScheduled && a.date === today && !a.checkedIn;
                  const canCheckOut = isScheduled && a.checkedIn && !a.checkedOutAt;
                  const canNoShow = isScheduled && a.date <= today && !a.checkedIn;
                  const canCancel = isScheduled && a.date >= today && !a.checkedIn;
                  const busy = busyId === a.appointmentId;
                  return (
                    <tr key={a.appointmentId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-700">{a.startTime}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Link to={`/staff/reception/patients/${a.patientId}`} className="font-medium text-navy hover:text-teal-700 hover:underline">
                          {a.patientName}
                        </Link>
                        {a.bookingChannel === "Phone" && <span className="ml-2 text-xs text-slate-500">by phone</span>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">Dr. {a.doctorName}</td>
                      <td className="px-4 py-3 text-slate-700">{a.specialty}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={isScheduled && a.checkedIn ? "Checked In" : a.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-700">{a.checkedInAt ?? <NotAvailable />}</td>
                      <td className="px-4 py-3 text-slate-700">{a.checkedOutAt ?? <NotAvailable />}</td>
                      <td className="space-x-3 whitespace-nowrap px-4 py-3 text-right">
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
      </section>

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
    </PortalPage>
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
        const res = await api.get<TimeSlot[]>("/api/availability", { params: { doctorId, date, patientId, includeTaken: true } });
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
  const selectedSlot = openTimes.find((t) => String(t.timeSlotId) === timeSlotId && t.available !== false);
  const anyOpen = openTimes.some((t) => t.available !== false);

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
            <span className="mb-1 block text-sm font-medium text-slate-700">Open Times</span>
            {checking ? (
              <p className="text-sm text-slate-500">Checking open times...</p>
            ) : needsReferral ? (
              <WarningBox>
                {times[0].specialty} is a specialty. This patient needs an approved referral to this doctor before an appointment can be booked.
              </WarningBox>
            ) : openTimes.length === 0 ? (
              <p className="text-sm text-slate-500">The doctor isn't working this date. Try another date.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {openTimes.map((t) =>
                  t.available === false ? (
                    // taken times stay in place, grayed out, so it's clear why they can't be picked
                    <button
                      key={t.timeSlotId}
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-400"
                    >
                      {t.startTime}
                    </button>
                  ) : (
                  <button
                    key={t.timeSlotId}
                    type="button"
                    onClick={() => setTimeSlotId(String(t.timeSlotId))}
                    className={`rounded-lg px-3 py-1.5 text-sm shadow-button ${
                      String(t.timeSlotId) === timeSlotId
                        ? "bg-navy text-white"
                        : "bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {t.startTime}
                  </button>
                  )
                )}
              </div>
            )}
            {!checking && openTimes.length > 0 && !anyOpen && (
              <p className="mt-2 text-sm text-slate-500">Every time on this date is taken. Try another date.</p>
            )}
            {selectedSlot?.referralId && <p className="mt-2 text-sm text-slate-600">Uses the patient's approved referral.</p>}
          </div>
        )}

        <ErrorText message={error} />
        {selectedSlot ? (
          <FormActions saving={saving} onCancel={onClose} saveLabel={`Book ${date} at ${selectedSlot.startTime}`} />
        ) : (
          <p className="text-sm text-slate-500">Choose a patient, doctor, date and time.</p>
        )}
      </form>
    </Modal>
  );
}
