import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, apiErrorMessage } from "../../api";
import { ErrorText, Field, SelectField } from "../../components/FormControls";
import { PageError, PortalPage } from "../../components/PortalPage";
import { PrimaryButton, Section, StatusBadge, SuccessText, TextButton } from "../../components/ProfileUI";
import { useAuth } from "../../context/AuthContext";

interface Appointment {
  appointmentId: number;
  appointmentDate: string;
  appointmentTime: string | null;
  doctorName: string;
  officeName: string;
  specialty: string | null;
  status: string;
  checkedIn: boolean;
}

interface Doctor {
  doctorId: number;
  firstName: string;
  lastName: string;
  specialties: { specialtyId: number; name: string }[];
}

interface TimeSlot {
  timeSlotId: number;
  startTime: string;
  officeName: string;
  specialtyId: number;
  requiresReferral: boolean;
  referralId: number | null;
  available?: boolean;
  unavailableReason?: string | null;
}

interface Referral {
  referralId: number;
  referringDoctorName: string;
  specialistName: string;
  specialty: string;
  dateIssued: string;
  expirationDate: string;
  status: string;
  expired: boolean;
}

// today's date at the clinic as YYYY-MM-DD
const clinicToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });

// 14:30 -> 2:30 PM
function showTime(value: string | null) {
  if (!value) return "—";
  const [hour, minute = "00"] = value.split(":");
  const h = Number(hour);
  return `${h % 12 || 12}:${minute} ${h >= 12 ? "PM" : "AM"}`;
}

export function PatientAppointments() {
  const { user } = useAuth();
  const patientId = user?.role === "patient" ? user.id : null;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [times, setTimes] = useState<TimeSlot[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [timeSlotId, setTimeSlotId] = useState("");
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [message, setMessage] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  // load my appointments and referrals
  useEffect(() => {
    async function loadAppointments() {
      if (!patientId) return;
      try {
        const appointmentsRes = await api.get<Appointment[]>(`/api/patient/${patientId}/appointments`);
        setAppointments(appointmentsRes.data);
        const referralsRes = await api.get<Referral[]>(`/api/patient/${patientId}/referrals`);
        setReferrals(referralsRes.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadAppointments();
  }, [patientId, reloadCount]);

  // load doctors for the booking form
  useEffect(() => {
    async function loadDoctors() {
      try {
        const res = await api.get<Doctor[]>("/api/public/doctors");
        setDoctors(res.data);
      } catch (err) {
        setBookingError(apiErrorMessage(err));
      }
    }
    loadDoctors();
  }, []);

  // check open times when the doctor or date changes
  useEffect(() => {
    async function loadTimes() {
      setChecking(true);
      setBookingError("");
      try {
        const res = await api.get<TimeSlot[]>("/api/availability", { params: { doctorId, date, includeTaken: true } });
        setTimes(res.data);
      } catch (err) {
        setTimes([]);
        setBookingError(apiErrorMessage(err));
      } finally {
        setChecking(false);
      }
    }
    if (!doctorId || !date) return;
    loadTimes();
  }, [doctorId, date, reloadCount]);

  // specialists need an approved referral before any time can be booked
  const needsReferral = times.length > 0 && times.every((t) => t.requiresReferral && !t.referralId);
  const openTimes = times.filter((t) => !t.requiresReferral || t.referralId);
  const selectedSlot = openTimes.find((t) => String(t.timeSlotId) === timeSlotId && t.available !== false);
  const anyOpen = openTimes.some((t) => t.available !== false);
  const selectedDoctor = doctors.find((d) => String(d.doctorId) === doctorId);
  const today = clinicToday();

  // book the selected time
  async function bookAppointment(e: FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    setSaving(true);
    setBookingError("");
    setMessage("");
    try {
      await api.post("/api/appointments", {
        doctorId: Number(doctorId),
        specialtyId: selectedSlot.specialtyId,
        date,
        timeSlotId: selectedSlot.timeSlotId,
        referralId: selectedSlot.referralId,
      });
      setMessage("Your appointment was booked.");
      setTimeSlotId("");
      setReloadCount(reloadCount + 1);
    } catch (err) {
      setBookingError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // cancel an upcoming appointment
  async function cancelAppointment(appointment: Appointment) {
    if (!window.confirm(`Cancel your appointment on ${appointment.appointmentDate}?`)) return;
    setError("");
    setMessage("");
    try {
      await api.patch(`/api/appointments/${appointment.appointmentId}/cancel`);
      setMessage("Your appointment was cancelled.");
      setReloadCount(reloadCount + 1);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <PortalPage eyebrow="Patient Portal" title="My Appointments" description={`Hi ${user?.firstName ?? "there"}, book and manage your visits here.`}>
      <PageError message={error} />
      <SuccessText message={message} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section title="Book an Appointment">
            <form onSubmit={bookAppointment} className="space-y-4">
              <SelectField
                label="Doctor"
                required
                value={doctorId}
                onChange={(e) => {
                  setDoctorId(e.target.value);
                  setTimes([]);
                  setTimeSlotId("");
                }}
              >
                <option value="">Choose a doctor</option>
                {doctors.map((d) => (
                  <option key={d.doctorId} value={d.doctorId}>
                    Dr. {d.firstName} {d.lastName}
                    {d.specialties.length > 0 && ` (${d.specialties.map((s) => s.name).join(", ")})`}
                  </option>
                ))}
              </SelectField>

              <Field
                label="Date"
                type="date"
                required
                min={today}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setTimes([]);
                  setTimeSlotId("");
                }}
              />

              {doctorId && date && (
                <div>
                  <span className="mb-1 block text-sm font-medium text-slate-700">Open Times</span>
                  {checking ? (
                    <p className="text-sm text-slate-500">Checking open times...</p>
                  ) : needsReferral ? (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      This specialist needs an approved referral from your doctor before you can book.
                    </p>
                  ) : openTimes.length === 0 ? (
                    <p className="text-sm text-slate-500">This doctor isn't working this date. Try another date.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {openTimes.map((t) =>
                        t.available === false ? (
                          // taken times stay in place, grayed out, so it's clear why they can't be picked
                          <button
                            key={t.timeSlotId}
                            type="button"
                            disabled
                            className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm text-slate-400"
                          >
                            {showTime(t.startTime)}
                          </button>
                        ) : (
                        <button
                          key={t.timeSlotId}
                          type="button"
                          onClick={() => setTimeSlotId(String(t.timeSlotId))}
                          className={`rounded-lg border px-3 py-1.5 text-sm ${
                            String(t.timeSlotId) === timeSlotId ? "border-navy bg-navy text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {showTime(t.startTime)}
                        </button>
                        )
                      )}
                    </div>
                  )}
                  {!checking && openTimes.length > 0 && !anyOpen && (
                    <p className="mt-2 text-sm text-slate-500">Every time on this date is taken. Try another date.</p>
                  )}
                </div>
              )}

              <ErrorText message={bookingError} />
              <PrimaryButton disabled={!selectedSlot || saving || checking}>{saving ? "Booking..." : "Confirm Appointment"}</PrimaryButton>
            </form>
          </Section>
        </div>

        <Section title="Your Selection">
          <dl className="space-y-3 text-sm">
            <div><dt className="text-slate-500">Doctor</dt><dd className="font-medium text-slate-900">{selectedDoctor ? `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}` : "Not selected"}</dd></div>
            <div><dt className="text-slate-500">Date</dt><dd className="font-medium text-slate-900">{date || "Not selected"}</dd></div>
            <div><dt className="text-slate-500">Time</dt><dd className="font-medium text-slate-900">{showTime(selectedSlot?.startTime ?? null)}</dd></div>
            <div><dt className="text-slate-500">Office</dt><dd className="font-medium text-slate-900">{selectedSlot?.officeName ?? "Not selected"}</dd></div>
            {selectedSlot?.referralId && <p className="text-slate-600">Uses your approved referral.</p>}
          </dl>
        </Section>
      </div>

      <Section title="Appointment History">
        {loading ? (
          <p className="text-slate-500">Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <p className="text-slate-500">No appointments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Doctor</th>
                  <th className="px-4 py-3">Specialty</th>
                  <th className="px-4 py-3">Office</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((a) => (
                  <tr key={a.appointmentId} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{a.appointmentDate}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{showTime(a.appointmentTime)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">Dr. {a.doctorName}</td>
                    <td className="px-4 py-3 text-slate-700">{a.specialty ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{a.officeName}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status === "Scheduled" && a.checkedIn ? "Checked In" : a.status} /></td>
                    <td className="px-4 py-3 text-right">
                      {a.status === "Scheduled" && !a.checkedIn && a.appointmentDate >= today && (
                        <TextButton danger onClick={() => cancelAppointment(a)}>Cancel</TextButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="My Referrals">
        {referrals.length === 0 ? (
          <p className="text-slate-500">No referrals.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {referrals.map((r) => (
              <li key={r.referralId} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span>
                  <span className="font-medium text-slate-900">{r.specialty}</span> with Dr. {r.specialistName}
                  <span className="text-slate-500"> · from Dr. {r.referringDoctorName} · valid until {r.expirationDate}</span>
                </span>
                <StatusBadge status={r.status === "Pending" && r.expired ? "Expired" : r.status} />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-slate-500">An approved referral lets you book that specialist above.</p>
      </Section>
    </PortalPage>
  );
}
