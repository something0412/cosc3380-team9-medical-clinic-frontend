import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, apiErrorMessage } from "../../api";
import { ErrorText, Field, SelectField } from "../../components/FormControls";
import { Modal } from "../../components/Modal";
import { PageError, PortalPage } from "../../components/PortalPage";
import { AlertIcon, DangerButton, NotAvailable, PrimaryButton, SecondaryButton, Section, StatusBadge, StatusText, SuccessText, TextButton } from "../../components/ProfileUI";
import { useAuth } from "../../context/AuthContext";
import { formatId } from "../../utils/id";

interface Appointment {
  appointmentId: number;
  appointmentDate: string;
  appointmentTime: string | null;
  doctorName: string;
  officeName: string;
  specialty: string | null;
  endTime?: string | null;
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

// current date and time at the clinic as YYYY-MM-DD HH:MM:SS
const clinicNow = () => new Date().toLocaleString("sv-SE", { timeZone: "America/Chicago" });

// appointment start as YYYY-MM-DD HH:MM
const startsAt = (a: Appointment) => `${a.appointmentDate} ${a.appointmentTime ?? "00:00"}`;

// 14:30 -> 2:30 PM
function showTime(value: string | null) {
  if (!value) return <NotAvailable />;
  const [hour, minute = "00"] = value.split(":");
  const h = Number(hour);
  return `${h % 12 || 12}:${minute} ${h >= 12 ? "PM" : "AM"}`;
}

// 2026-11-13 -> Friday, November 13, 2026
const showLongDate = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

// one appointment's details, shown right after booking and from the View button
function AppointmentDetails({ appointment, booked, onClose }: { appointment: Appointment; booked: boolean; onClose: () => void }) {
  const a = appointment;
  return (
    <Modal title={booked ? "Appointment Booked" : "Appointment Details"} onClose={onClose}>
      {booked && (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
          <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12.5l2.5 2.5L16 9.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm font-medium">Your appointment was booked successfully.</p>
        </div>
      )}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
        <div className="col-span-2"><dt className="text-slate-500">Date</dt><dd className="font-medium text-slate-900">{showLongDate(a.appointmentDate)}</dd></div>
        <div>
          <dt className="text-slate-500">Time</dt>
          <dd className="font-medium text-slate-900">
            {showTime(a.appointmentTime)}
            {a.endTime && <> - {showTime(a.endTime)}</>}
          </dd>
        </div>
        <div><dt className="text-slate-500">Appointment Number</dt><dd className="font-mono font-medium text-slate-900">#{formatId(a.appointmentId)}</dd></div>
        <div><dt className="text-slate-500">Doctor</dt><dd className="font-medium text-slate-900">Dr. {a.doctorName}</dd></div>
        <div><dt className="text-slate-500">Specialty</dt><dd className="font-medium text-slate-900">{a.specialty ?? <NotAvailable />}</dd></div>
        <div><dt className="text-slate-500">Office</dt><dd className="font-medium text-slate-900">{a.officeName}</dd></div>
        <div>
          <dt className="text-slate-500">Status</dt>
          <dd className="font-medium"><StatusText status={a.status === "Scheduled" && a.checkedIn ? "Checked In" : a.status} /></dd>
        </div>
      </dl>
      <div className="mt-6 flex justify-end">
        <SecondaryButton onClick={onClose}>Close</SecondaryButton>
      </div>
    </Modal>
  );
}

// appointments table used by both sections
function AppointmentTable({
  appointments,
  onView,
  onCancel,
}: {
  appointments: Appointment[];
  onView: (a: Appointment) => void;
  onCancel?: (a: Appointment) => void;
}) {
  return (
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
              <td className="px-4 py-3 text-slate-700">{a.specialty ?? <NotAvailable />}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{a.officeName}</td>
              <td className="px-4 py-3"><StatusBadge status={a.status === "Scheduled" && a.checkedIn ? "Checked In" : a.status} /></td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <TextButton onClick={() => onView(a)}>View</TextButton>
                {onCancel && a.status === "Scheduled" && !a.checkedIn && (
                  <TextButton danger className="ml-4" onClick={() => onCancel(a)}>Cancel</TextButton>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PatientAppointments() {
  const { user } = useAuth();
  const patientId = user?.role === "patient" ? user.id : null;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [times, setTimes] = useState<TimeSlot[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [primaryDoctorId, setPrimaryDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [timeSlotId, setTimeSlotId] = useState("");
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [message, setMessage] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const [cancelling, setCancelling] = useState<Appointment | null>(null);
  const [cancelSaving, setCancelSaving] = useState(false);
  const [tab, setTab] = useState("upcoming");
  const [details, setDetails] = useState<{ appointment: Appointment; booked: boolean } | null>(null);

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

  // load doctors for the booking form, with my primary doctor picked first
  useEffect(() => {
    async function loadDoctors() {
      if (!patientId) return;
      try {
        const res = await api.get<Doctor[]>("/api/public/doctors");
        setDoctors(res.data);
        const profileRes = await api.get<{ primaryDoctor: { doctorId: number } | null }>(`/api/patient/${patientId}/profile`);
        const primary = profileRes.data.primaryDoctor;
        if (primary && res.data.some((d) => d.doctorId === primary.doctorId)) {
          setPrimaryDoctorId(String(primary.doctorId));
          setDoctorId(String(primary.doctorId));
        }
      } catch (err) {
        setBookingError(apiErrorMessage(err));
      }
    }
    loadDoctors();
  }, [patientId]);

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

  const now = clinicNow();

  // still to come (date and time), closest first
  const upcoming = appointments
    .filter((a) => a.status !== "Cancelled" && startsAt(a) > now)
    .sort((a, b) => startsAt(a).localeCompare(startsAt(b)));

  // already started or passed, most recent first
  const history = appointments
    .filter((a) => a.status !== "Cancelled" && startsAt(a) <= now)
    .sort((a, b) => startsAt(b).localeCompare(startsAt(a)));

  // cancelled, soonest to latest
  const cancelled = appointments
    .filter((a) => a.status === "Cancelled")
    .sort((a, b) => startsAt(a).localeCompare(startsAt(b)));

  // book the selected time
  async function bookAppointment(e: FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    setSaving(true);
    setBookingError("");
    setMessage("");
    try {
      const res = await api.post("/api/appointments", {
        doctorId: Number(doctorId),
        specialtyId: selectedSlot.specialtyId,
        date,
        timeSlotId: selectedSlot.timeSlotId,
        referralId: selectedSlot.referralId,
      });
      // show the new appointment in the booked pop-up
      setDetails({
        booked: true,
        appointment: {
          ...res.data,
          appointmentDate: res.data.date,
          appointmentTime: res.data.startTime,
        },
      });
      setTab("upcoming");
      setTimeSlotId("");
      setReloadCount(reloadCount + 1);
    } catch (err) {
      setBookingError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // cancel the appointment after the patient confirms in the pop-up
  async function cancelAppointment(appointment: Appointment) {
    setError("");
    setMessage("");
    setCancelSaving(true);
    try {
      await api.patch(`/api/appointments/${appointment.appointmentId}/cancel`);
      setMessage("Your appointment was cancelled.");
      setReloadCount(reloadCount + 1);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setCancelSaving(false);
      setCancelling(null);
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
                    {String(d.doctorId) === primaryDoctorId && " (Primary)"}
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
                    <p className="flex items-center gap-2 text-sm italic text-red-600">
                      <AlertIcon className="h-4 w-4" />
                      This specialist needs an approved referral from your primary doctor before you can book.
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
                            className="cursor-not-allowed rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-400"
                          >
                            {showTime(t.startTime)}
                          </button>
                        ) : (
                        <button
                          key={t.timeSlotId}
                          type="button"
                          onClick={() => setTimeSlotId(String(t.timeSlotId))}
                          className={`rounded-lg px-3 py-1.5 text-sm shadow-button ${
                            String(t.timeSlotId) === timeSlotId ? "bg-navy text-white" : "bg-white text-slate-700 hover:bg-slate-50"
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

      <Section title="Appointments">
        <div className="mb-4 flex gap-6 border-b border-slate-200">
          {[
            ["upcoming", `Upcoming (${upcoming.length})`],
            ["history", `History (${history.length})`],
            ["cancelled", `Cancelled (${cancelled.length})`],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`-mb-px border-b-2 pb-3 text-sm font-semibold ${
                tab === key ? "border-navy text-navy" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-slate-500">Loading appointments...</p>
        ) : tab === "upcoming" ? (
          upcoming.length === 0 ? (
            <p className="text-slate-500">No upcoming appointments.</p>
          ) : (
            <AppointmentTable appointments={upcoming} onView={(a) => setDetails({ appointment: a, booked: false })} onCancel={setCancelling} />
          )
        ) : tab === "history" ? (
          history.length === 0 ? (
            <p className="text-slate-500">No past appointments.</p>
          ) : (
            <AppointmentTable appointments={history} onView={(a) => setDetails({ appointment: a, booked: false })} />
          )
        ) : cancelled.length === 0 ? (
          <p className="text-slate-500">No cancelled appointments.</p>
        ) : (
          <AppointmentTable appointments={cancelled} onView={(a) => setDetails({ appointment: a, booked: false })} />
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
                <StatusText status={r.status === "Pending" && r.expired ? "Expired" : r.status} />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-slate-500">An approved referral lets you book that specialist above.</p>
      </Section>
      {details && <AppointmentDetails appointment={details.appointment} booked={details.booked} onClose={() => setDetails(null)} />}

      {cancelling && (
        <Modal title="Cancel Appointment" onClose={() => !cancelSaving && setCancelling(null)}>
          <p className="text-sm text-slate-700">
            Are you sure you want to cancel this appointment with Dr. {cancelling.doctorName} on {cancelling.appointmentDate}
            {cancelling.appointmentTime && <> at {showTime(cancelling.appointmentTime)}</>} at {cancelling.officeName}?
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <SecondaryButton disabled={cancelSaving} onClick={() => setCancelling(null)}>Keep Appointment</SecondaryButton>
            <DangerButton disabled={cancelSaving} onClick={() => cancelAppointment(cancelling)}>{cancelSaving ? "Cancelling..." : "Cancel Appointment"}</DangerButton>
          </div>
        </Modal>
      )}
    </PortalPage>
  );
}
