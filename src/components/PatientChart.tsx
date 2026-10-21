import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { authErrorMessage } from "../services/authApi";
import { addVitals, getPatientChart } from "../services/nursingApi";
import type { NewVitals } from "../services/nursingApi";
import type { Appointment, PatientChart as Chart } from "../types";

// One patient's chart, used by every nursing page: name, allergies,
// vitals and current medications.
//
// `canRecordVitals` shows the vitals form (RN Workspace); without it the
// chart is read-only (Patient Charts page).
//
// `appointment` is today's visit, if any — shown in the header and
// attached to any vitals recorded.
export function PatientChart({
  patientId,
  canRecordVitals = false,
  appointment,
}: {
  patientId: number;
  canRecordVitals?: boolean;
  appointment?: Appointment;
}) {
  const [chart, setChart] = useState<Chart | null>(null);
  const [error, setError] = useState("");
  // Changing this number re-runs the effect below, reloading the chart
  // after the nurse saves something.
  const [reloadCount, setReloadCount] = useState(0);
  const reload = () => setReloadCount((n) => n + 1);

  useEffect(() => {
    // If the nurse clicks another patient before this request finishes,
    // ignore its result so a slow old response can't replace the new one.
    let ignore = false;
    async function loadChart() {
      try {
        setError("");
        const data = await getPatientChart(patientId);
        if (!ignore) setChart(data);
      } catch {
        if (!ignore) setError("Could not load this patient's chart.");
      }
    }
    loadChart();
    return () => {
      ignore = true;
    };
  }, [patientId, reloadCount]);

  if (error) return <p className="text-sm text-red-700">{error}</p>;
  // Also wait if the loaded chart is still the previously selected
  // patient's, so their allergies are never shown under the wrong name.
  if (!chart || chart.patient.patientId !== patientId) {
    return <p className="text-sm text-gray-500">Loading chart…</p>;
  }

  const { patient } = chart;

  return (
    <div className="space-y-6">
      {/* Name, DOB and today's visit */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {patient.firstName} {patient.lastName}
        </h2>
        <p className="text-sm text-gray-600">
          Patient #{patient.patientId} · DOB {patient.dob}
          {patient.gender && ` · ${patient.gender}`} · {patient.phone}
        </p>
        <p className="text-sm text-gray-600">
          Today: {appointment ? `${appointment.specialty} with ${appointment.doctorName} (${appointment.status})` : "No appointment"}
        </p>
      </div>

      {/* Allergies: shown first because nurses must check them before
          doing anything else. */}
      <div className="rounded border border-red-300 bg-red-50 p-3">
        <h3 className="text-sm font-semibold text-red-800">Allergies</h3>
        {chart.allergies.length === 0 ? (
          <p className="text-sm text-gray-700">No known allergies</p>
        ) : (
          <ul className="text-sm text-red-900">
            {chart.allergies.map((a) => (
              <li key={a.allergyId} className={a.severity === "Severe" ? "font-bold" : ""}>
                {a.allergen} — {a.severity}
                {a.reaction && ` (${a.reaction})`}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Vitals */}
      <section>
        <h3 className="mb-2 font-semibold text-gray-900">Vitals</h3>
        {canRecordVitals && (
          <VitalsForm patientId={patientId} appointmentId={appointment?.appointmentId ?? null} onSaved={reload} />
        )}
        {chart.vitals.length === 0 ? (
          <p className="text-sm text-gray-500">No vitals recorded.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-600">
                <tr>
                  <th>BP</th>
                  <th>HR (bpm)</th>
                  <th>Temp (°F)</th>
                  <th>Weight (lbs)</th>
                  <th>Height (in)</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {chart.vitals.map((v) => (
                  <tr key={v.vitalsId} className="border-t border-gray-100">
                    <td>{v.systolic !== null ? `${v.systolic}-${v.diastolic}` : "—"}</td>
                    <td>{v.heartRateBpm ?? "—"}</td>
                    <td>{v.temperatureF ?? "—"}</td>
                    <td>{v.weightLbs ?? "—"}</td>
                    <td>{v.heightInches ?? "—"}</td>
                    <td>{v.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Medications */}
      <section>
        <h3 className="mb-2 font-semibold text-gray-900">Medications</h3>
        {chart.medications.length === 0 ? (
          <p className="text-sm text-gray-500">No current medications.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {chart.medications.map((m) => (
              <li key={`${m.source}-${m.id}`} className="rounded border border-gray-200 p-2">
                {m.name}
                {m.dosage && ` ${m.dosage}`}
                {m.directions && `, ${m.directions}`}
                <span className="text-gray-500">
                  {" "}· {m.source === "Home" ? "Home med" : "Prescribed"} since {m.startDate}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// The number inputs; blood pressure has its own "120-80" text box.
// Empty fields are sent as null ("not measured").
const VITAL_FIELDS: { key: Exclude<keyof NewVitals, "systolic" | "diastolic">; label: string }[] = [
  { key: "heartRateBpm", label: "Heart rate (bpm)" },
  { key: "temperatureF", label: "Temp (°F)" },
  { key: "weightLbs", label: "Weight (lbs)" },
  { key: "heightInches", label: "Height (in)" },
];

// "120-80" (or "120/80") -> { systolic: 120, diastolic: 80 }; null if it
// doesn't look like a blood pressure.
function parseBloodPressure(text: string) {
  const match = text.trim().match(/^(\d{2,3})\s*[-/]\s*(\d{2,3})$/);
  return match ? { systolic: Number(match[1]), diastolic: Number(match[2]) } : null;
}

function VitalsForm({
  patientId,
  appointmentId,
  onSaved,
}: {
  patientId: number;
  appointmentId: number | null;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  // Inputs hold strings while typing; converted to numbers on save.
  const [values, setValues] = useState<Record<string, string>>({});
  const [bloodPressure, setBloodPressure] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const toNumber = (key: string) => (values[key] ? Number(values[key]) : null);

    const bp = bloodPressure.trim() ? parseBloodPressure(bloodPressure) : null;
    if (bloodPressure.trim() && !bp) {
      alert('Enter blood pressure like "120-80".');
      return;
    }
    if (!bp && VITAL_FIELDS.every((f) => !values[f.key])) {
      alert("Enter at least one vital sign.");
      return;
    }

    try {
      await addVitals(patientId, user.id, appointmentId, {
        temperatureF: toNumber("temperatureF"),
        heartRateBpm: toNumber("heartRateBpm"),
        systolic: bp?.systolic ?? null,
        diastolic: bp?.diastolic ?? null,
        weightLbs: toNumber("weightLbs"),
        heightInches: toNumber("heightInches"),
      });
      setValues({});
      setBloodPressure("");
      onSaved();
    } catch (err) {
      alert(`Could not save vitals: ${authErrorMessage(err)}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-2 rounded border border-gray-200 bg-gray-50 p-3">
      <label className="text-xs text-gray-700">
        Blood pressure
        <input
          placeholder="120-80"
          value={bloodPressure}
          onChange={(e) => setBloodPressure(e.target.value)}
          className="mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm"
        />
      </label>
      {VITAL_FIELDS.map((f) => (
        <label key={f.key} className="text-xs text-gray-700">
          {f.label}
          <input
            type="number"
            step="any"
            value={values[f.key] ?? ""}
            onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
            className="mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm"
          />
        </label>
      ))}
      <button
        type="submit"
        className="col-span-3 rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
      >
        Save vitals
      </button>
    </form>
  );
}
