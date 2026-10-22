import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiErrorMessage } from "../../api";
import { addVitals } from "../../services/nursingApi";
import type { NewVitals } from "../../services/nursingApi";
import type { Vitals } from "../../types";

// The patient's vitals (newest first) and, for nurses who can edit, the
// form to record a new set. Saved readings are linked to today's visit.
export function VitalsTab({
  patientId,
  vitals,
  appointmentId,
  canEdit,
  onSaved,
}: {
  patientId: number;
  vitals: Vitals[];
  appointmentId: number | null;
  canEdit: boolean;
  onSaved: () => void;
}) {
  return (
    <div className="space-y-3">
      {canEdit && <VitalsForm patientId={patientId} appointmentId={appointmentId} onSaved={onSaved} />}
      {vitals.length === 0 ? (
        <p className="text-sm text-gray-500">No vitals recorded.</p>
      ) : (
        <div className="overflow-x-auto">
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
              {vitals.map((v) => (
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
      alert(`Could not save vitals: ${apiErrorMessage(err)}`);
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
