import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { authErrorMessage } from "../../../services/authApi";
import { bookAppointment, getAvailability, getReferrals, getSpecialties } from "../../../services/frontDeskApi";
import { getPatients } from "../../../services/nursingApi";
import type { AvailableSlot, Patient, Referral, Specialty } from "../../../types";
import { today } from "../../../utils/dates";

const inputClass = "mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm";

// Schedule (receptionists): book a phone appointment at the receptionist's
// office. Pick patient, specialty and date, then one of the open slots
// (across every doctor working that specialty there that day). Specialties
// that need a referral show the patient's valid referrals to attach.
export function Schedule() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [patientId, setPatientId] = useState(searchParams.get("patientId") ?? "");
  const [specialtyId, setSpecialtyId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [slot, setSlot] = useState<AvailableSlot | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralId, setReferralId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([getPatients(), getSpecialties()])
      .then(([patientList, specialtyList]) => {
        setPatients(patientList);
        setSpecialties(specialtyList);
      })
      .catch(() => setMessage("Could not load patients and specialties."));
  }, []);

  // Open slots for the chosen specialty and day; re-fetched when either changes.
  useEffect(() => {
    if (!specialtyId || !date || !user?.officeId) return;
    let ignore = false;
    getAvailability({ date, officeId: user.officeId, specialtyId: Number(specialtyId) })
      .then((data) => {
        if (!ignore) setSlots(data);
      })
      .catch(() => {
        if (!ignore) setMessage("Could not load open slots.");
      });
    return () => {
      ignore = true;
    };
  }, [specialtyId, date, user?.officeId]);

  // Changing the patient, specialty or date makes the chosen slot (and its
  // referrals) wrong, so clear them; the effect above reloads the slots.
  function resetSlot() {
    setSlot(null);
    setReferrals([]);
    setReferralId("");
  }

  async function chooseSlot(chosen: AvailableSlot) {
    setSlot(chosen);
    setReferralId("");
    setReferrals([]);
    if (!chosen.requiresReferral || !patientId) return;
    try {
      setReferrals(
        await getReferrals(Number(patientId), { doctorId: chosen.doctorId, specialtyId: Number(specialtyId), date }),
      );
    } catch {
      setMessage("Could not load referrals.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !slot) return;
    try {
      const booked = await bookAppointment(user.id, {
        patientId: Number(patientId),
        doctorId: slot.doctorId,
        specialtyId: Number(specialtyId),
        date,
        timeSlotId: slot.timeSlotId,
        referralId: referralId ? Number(referralId) : null,
      });
      setMessage(`Booked ${booked.patientName} with ${booked.doctorName} on ${date} at ${slot.startTime}.`);
      // That slot is taken now.
      setSlots(slots.filter((s) => s !== slot));
      resetSlot();
    } catch (err) {
      setMessage(`Could not book: ${authErrorMessage(err)}`);
    }
  }

  const missingReferral = slot?.requiresReferral && !referralId;

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Schedule</h1>
      <p className="mt-1 text-sm text-gray-500">Book an appointment at your office.</p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid gap-3 rounded border border-gray-200 bg-white p-4 sm:grid-cols-3"
      >
        <label className="text-sm">
          Patient
          <select
            required
            value={patientId}
            onChange={(e) => {
              setPatientId(e.target.value);
              resetSlot();
            }}
            className={inputClass}
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
          Specialty
          <select
            required
            value={specialtyId}
            onChange={(e) => {
              setSpecialtyId(e.target.value);
              setSlots([]);
              resetSlot();
            }}
            className={inputClass}
          >
            <option value="">Select a specialty…</option>
            {specialties.map((s) => (
              <option key={s.specialtyId} value={s.specialtyId}>
                {s.name}
                {s.requiresReferral && " (referral required)"}
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
            onChange={(e) => {
              setDate(e.target.value);
              setSlots([]);
              resetSlot();
            }}
            className={inputClass}
          />
        </label>

        <div className="sm:col-span-3">
          <p className="text-sm text-gray-700">Open times</p>
          {!specialtyId || !date ? (
            <p className="mt-1 text-sm text-gray-500">Pick a specialty and date first.</p>
          ) : slots.length === 0 ? (
            <p className="mt-1 text-sm text-gray-500">No open times that day at your office.</p>
          ) : (
            <div className="mt-1 flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  key={`${s.doctorId}-${s.timeSlotId}`}
                  type="button"
                  onClick={() => chooseSlot(s)}
                  className={`rounded border px-3 py-2 text-sm ${
                    s === slot ? "border-blue-600 bg-blue-50 font-medium" : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {s.startTime}–{s.endTime} · {s.doctorName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Only specialties like cardiology need a referral. */}
        {slot?.requiresReferral && (
          <label className="text-sm sm:col-span-3">
            Referral
            {referrals.length === 0 ? (
              <p className="mt-1 text-sm font-medium text-red-700">
                This patient has no approved, unexpired referral to {slot.doctorName} for this specialty, so this
                visit can't be booked.
              </p>
            ) : (
              <select required value={referralId} onChange={(e) => setReferralId(e.target.value)} className={inputClass}>
                <option value="">Select a referral…</option>
                {referrals.map((r) => (
                  <option key={r.referralId} value={r.referralId}>
                    #{r.referralId} from {r.referredBy} · expires {r.expirationDate}
                  </option>
                ))}
              </select>
            )}
          </label>
        )}

        <button
          type="submit"
          disabled={!slot || !patientId || missingReferral}
          className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 sm:col-span-3"
        >
          Book appointment
        </button>
        {message && (
          <p className="text-sm text-gray-700 sm:col-span-3">
            {message} <Link to="/staff/front-desk" className="text-blue-700 hover:underline">Go to Front Desk</Link>
          </p>
        )}
      </form>
    </div>
  );
}
