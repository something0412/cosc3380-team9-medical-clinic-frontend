import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { ErrorText, Field, SelectField } from "../../components/FormControls";
import { Modal } from "../../components/Modal";
import { FormActions, PrimaryButton, Section, StatusBadge, TextButton } from "../../components/ProfileUI";

interface Referral {
  referralId: number;
  patientId: number;
  patientName: string;
  otherDoctor: string;
  specialty: string;
  dateIssued: string;
  expirationDate: string;
  status: string;
  appointmentDate?: string | null;
}

interface PatientOption {
  patientId: number;
  firstName: string;
  lastName: string;
}

interface Specialist {
  doctorId: number;
  doctorName: string;
  specialtyId: number;
  specialty: string;
}

export function DoctorReferrals() {
  const [sent, setSent] = useState<Referral[]>([]);
  const [received, setReceived] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [bookingFor, setBookingFor] = useState<Referral | null>(null);

  // load referrals
  useEffect(() => {
    async function loadReferrals() {
      try {
        const res = await api.get<{ sent: Referral[]; received: Referral[] }>("/api/doctor/referrals");
        setSent(res.data.sent);
        setReceived(res.data.received);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadReferrals();
  }, [reloadCount]);

  // approve or deny
  async function answerReferral(referral: Referral, status: "Approved" | "Denied") {
    try {
      await api.patch(`/api/doctor/referrals/${referral.referralId}/status`, { status });
      setReloadCount(reloadCount + 1);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referrals</h1>
          <p className="mt-1 text-gray-600">Send patients to specialists and answer referrals sent to you.</p>
        </div>
        <PrimaryButton type="button" onClick={() => setShowForm(true)}>
          New Referral
        </PrimaryButton>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {loading && <p>Loading referrals...</p>}

      {!loading && (
        <>
          <Section title="Sent to Me">
            {received.length === 0 ? (
              <p className="text-gray-500">No referrals sent to you.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full whitespace-nowrap text-left text-sm">
                  <thead>
                    <tr className="border-b text-gray-500">
                      <th className="p-2 font-medium">Patient</th>
                      <th className="p-2 font-medium">From</th>
                      <th className="p-2 font-medium">Specialty</th>
                      <th className="p-2 font-medium">Issued</th>
                      <th className="p-2 font-medium">Expires</th>
                      <th className="p-2 font-medium">Status</th>
                      <th className="p-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {received.map((r) => (
                      <tr key={r.referralId} className="border-b last:border-0">
                        <td className="p-2">
                          <Link to={`/doctor/patients/${r.patientId}`} className="font-medium text-blue-600 hover:underline">
                            {r.patientName}
                          </Link>
                        </td>
                        <td className="p-2">Dr. {r.otherDoctor}</td>
                        <td className="p-2">{r.specialty}</td>
                        <td className="p-2">{r.dateIssued}</td>
                        <td className="p-2">{r.expirationDate}</td>
                        <td className="p-2"><StatusBadge status={r.status} /></td>
                        <td className="p-2">
                          {r.status === "Pending" && (
                            <div className="flex gap-4">
                              <TextButton onClick={() => answerReferral(r, "Approved")}>Approve</TextButton>
                              <TextButton danger onClick={() => answerReferral(r, "Denied")}>Deny</TextButton>
                            </div>
                          )}
                          {r.status === "Approved" && r.appointmentDate && (
                            <span className="text-gray-600">Booked {r.appointmentDate}</span>
                          )}
                          {r.status === "Approved" && !r.appointmentDate && (
                            <TextButton onClick={() => setBookingFor(r)}>Book appointment</TextButton>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title="Sent by Me">
            {sent.length === 0 ? (
              <p className="text-gray-500">You haven't sent any referrals.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full whitespace-nowrap text-left text-sm">
                  <thead>
                    <tr className="border-b text-gray-500">
                      <th className="p-2 font-medium">Patient</th>
                      <th className="p-2 font-medium">Specialist</th>
                      <th className="p-2 font-medium">Specialty</th>
                      <th className="p-2 font-medium">Issued</th>
                      <th className="p-2 font-medium">Expires</th>
                      <th className="p-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sent.map((r) => (
                      <tr key={r.referralId} className="border-b last:border-0">
                        <td className="p-2">
                          <Link to={`/doctor/patients/${r.patientId}`} className="font-medium text-blue-600 hover:underline">
                            {r.patientName}
                          </Link>
                        </td>
                        <td className="p-2">Dr. {r.otherDoctor}</td>
                        <td className="p-2">{r.specialty}</td>
                        <td className="p-2">{r.dateIssued}</td>
                        <td className="p-2">{r.expirationDate}</td>
                        <td className="p-2"><StatusBadge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </>
      )}

      {bookingFor && (
        <BookAppointmentModal
          referral={bookingFor}
          onClose={() => setBookingFor(null)}
          onSaved={() => setReloadCount(reloadCount + 1)}
        />
      )}

      {showForm && (
        <NewReferralModal onClose={() => setShowForm(false)} onSaved={() => setReloadCount(reloadCount + 1)} />
      )}
    </div>
  );
}

function NewReferralModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [patientId, setPatientId] = useState("");
  const [specialistKey, setSpecialistKey] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // load patients and specialists for the dropdowns
  useEffect(() => {
    async function loadOptions() {
      try {
        const patientsRes = await api.get<PatientOption[]>("/api/doctor/patients");
        setPatients(patientsRes.data);
        const specialistsRes = await api.get<Specialist[]>("/api/doctor/specialists");
        setSpecialists(specialistsRes.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    loadOptions();
  }, []);

  // send the referral
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const [specialistDoctorId, specialtyId] = specialistKey.split("-");
    try {
      await api.post("/api/doctor/referrals", {
        patientId: Number(patientId),
        specialistDoctorId: Number(specialistDoctorId),
        specialtyId: Number(specialtyId),
        expirationDate: expirationDate || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="New Referral" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectField label="Patient" required value={patientId} onChange={(e) => setPatientId(e.target.value)}>
          <option value="">Select a patient</option>
          {patients.map((p) => (
            <option key={p.patientId} value={p.patientId}>{p.lastName}, {p.firstName}</option>
          ))}
        </SelectField>
        <SelectField label="Specialist" required value={specialistKey} onChange={(e) => setSpecialistKey(e.target.value)}>
          <option value="">Select a specialist</option>
          {specialists.map((s) => (
            <option key={`${s.doctorId}-${s.specialtyId}`} value={`${s.doctorId}-${s.specialtyId}`}>
              {s.specialty} · Dr. {s.doctorName}
            </option>
          ))}
        </SelectField>
        <Field
          label="Expiration Date (optional, defaults to 90 days)"
          type="date"
          value={expirationDate}
          onChange={(e) => setExpirationDate(e.target.value)}
        />
        <ErrorText message={error} />
        <FormActions saving={saving} onCancel={onClose} saveLabel="Send Referral" />
      </form>
    </Modal>
  );
}

function BookAppointmentModal({ referral, onClose, onSaved }: { referral: Referral; onClose: () => void; onSaved: () => void }) {
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<{ timeSlotId: number; startTime: string; endTime: string }[]>([]);
  const [timeSlotId, setTimeSlotId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // load open times when the date changes
  useEffect(() => {
    async function loadSlots() {
      try {
        const res = await api.get("/api/doctor/open-slots", { params: { date } });
        setSlots(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    if (date) loadSlots();
  }, [date]);

  // book the appointment
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post(`/api/doctor/referrals/${referral.referralId}/appointment`, {
        date,
        timeSlotId: Number(timeSlotId),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Book ${referral.patientName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">
          {referral.specialty} referral from Dr. {referral.otherDoctor}. Valid until {referral.expirationDate}.
        </p>
        <Field
          label="Date"
          type="date"
          required
          max={referral.expirationDate}
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setTimeSlotId("");
          }}
        />
        <SelectField label="Time" required value={timeSlotId} onChange={(e) => setTimeSlotId(e.target.value)}>
          <option value="">{date ? (slots.length ? "Select a time" : "No open times (not working that day, or fully booked)") : "Pick a date first"}</option>
          {slots.map((s) => (
            <option key={s.timeSlotId} value={s.timeSlotId}>{s.startTime} - {s.endTime}</option>
          ))}
        </SelectField>
        <ErrorText message={error} />
        <FormActions saving={saving} onCancel={onClose} saveLabel="Book Appointment" />
      </form>
    </Modal>
  );
}
