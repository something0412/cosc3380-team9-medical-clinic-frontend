import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { addNote, addVitals, getPatientChart, giveMedication } from "../services/nursingApi";
import type { NewVitals } from "../services/nursingApi";
import type { Appointment, NurseType, PatientChart as Chart } from "../types";

// One patient's chart, used by every nursing page.
//
// `role` decides what the nurse can do:
//   - no role → read-only (Patient Charts page)
//   - NA      → record vitals, add notes
//   - RN      → same, plus mark medications as given
//   - CRNA    → record vitals, add notes
// NAs can't give medications, so only RNs get the "Give" button.
//
// `appointment` is today's visit, if any — used to show check-in status.
export function PatientChart({
  patientId,
  role,
  appointment,
}: {
  patientId: number;
  role?: NurseType;
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
      {/* Name, DOB and today's check-in status */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {patient.firstName} {patient.lastName}
        </h2>
        <p className="text-sm text-gray-600">
          Patient #{patient.patientId} · DOB {patient.dob.slice(0, 10)} · {patient.phone}
        </p>
        <p className="text-sm text-gray-600">
          Today: {appointment ? `${appointment.status} — ${appointment.reason ?? "visit"}` : "No appointment"}
          {appointment?.roomNumber && ` · Room ${appointment.roomNumber}`}
        </p>
      </div>

      {/* Allergies and blood type: shown first because nurses must check
          them before doing anything else. */}
      <div className="flex gap-3">
        <div className="flex-1 rounded border border-red-300 bg-red-50 p-3">
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
        <div className="w-32 rounded border border-gray-300 p-3 text-center">
          <h3 className="text-sm font-semibold text-gray-700">Blood type</h3>
          <p className="text-2xl font-bold text-gray-900">{chart.bloodType ?? "Unknown"}</p>
        </div>
      </div>

      {/* Vitals */}
      <section>
        <h3 className="mb-2 font-semibold text-gray-900">Vitals</h3>
        {role && <VitalsForm patientId={patientId} role={role} onSaved={reload} />}
        {chart.vitals.length === 0 ? (
          <p className="text-sm text-gray-500">No vitals recorded.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-600">
                <tr>
                  <th>Time</th>
                  <th>BP</th>
                  <th>HR</th>
                  <th>RR</th>
                  <th>Temp</th>
                  <th>SpO₂</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {chart.vitals.map((v) => (
                  <tr key={v.vitalsId} className="border-t border-gray-100">
                    <td>{new Date(v.recordedAt).toLocaleString()}</td>
                    <td>{v.systolic ?? "—"}/{v.diastolic ?? "—"}</td>
                    <td>{v.heartRate ?? "—"}</td>
                    <td>{v.respiratoryRate ?? "—"}</td>
                    <td>{v.temperatureF ?? "—"}</td>
                    <td>{v.oxygenSaturation ?? "—"}</td>
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
          <p className="text-sm text-gray-500">No medications.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {chart.medications.map((m) => (
              <li key={m.medicationId} className="flex items-center justify-between rounded border border-gray-200 p-2">
                <span>
                  {m.name} {m.dosage}, {m.frequency}
                  <span className="text-gray-500">
                    {" "}· Last given: {m.lastGivenAt ? new Date(m.lastGivenAt).toLocaleString() : "never"}
                  </span>
                </span>
                {role === "RN" && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await giveMedication(patientId, m.medicationId);
                        reload();
                      } catch {
                        alert("Could not record the dose. Please try again.");
                      }
                    }}
                    className="text-sm font-medium text-blue-700 hover:underline"
                  >
                    Mark given
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Notes */}
      <section>
        <h3 className="mb-2 font-semibold text-gray-900">Notes</h3>
        {role && <NoteForm patientId={patientId} role={role} onSaved={reload} />}
        {chart.notes.length === 0 ? (
          <p className="text-sm text-gray-500">No notes yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {chart.notes.map((n) => (
              <li key={n.noteId} className="rounded border border-gray-200 p-2 text-sm">
                <p className="text-xs text-gray-500">
                  {new Date(n.createdAt).toLocaleString()} · {n.authorRole}
                </p>
                <p>{n.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// Empty fields are sent as null ("not measured").
const VITAL_FIELDS: { key: keyof NewVitals; label: string }[] = [
  { key: "systolic", label: "BP systolic" },
  { key: "diastolic", label: "BP diastolic" },
  { key: "heartRate", label: "Heart rate" },
  { key: "respiratoryRate", label: "Resp. rate" },
  { key: "temperatureF", label: "Temp (°F)" },
  { key: "oxygenSaturation", label: "SpO₂ (%)" },
];

function VitalsForm({
  patientId,
  role,
  onSaved,
}: {
  patientId: number;
  role: NurseType;
  onSaved: () => void;
}) {
  // Inputs hold strings while typing; converted to numbers on save.
  const [values, setValues] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const toNumber = (key: string) => (values[key] ? Number(values[key]) : null);
    if (VITAL_FIELDS.every((f) => !values[f.key])) {
      alert("Enter at least one vital sign.");
      return;
    }
    try {
      await addVitals(patientId, role, {
        systolic: toNumber("systolic"),
        diastolic: toNumber("diastolic"),
        heartRate: toNumber("heartRate"),
        respiratoryRate: toNumber("respiratoryRate"),
        temperatureF: toNumber("temperatureF"),
        oxygenSaturation: toNumber("oxygenSaturation"),
      });
      setValues({});
      onSaved();
    } catch {
      alert("Could not save vitals. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-2 rounded border border-gray-200 bg-gray-50 p-3">
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

function NoteForm({
  patientId,
  role,
  onSaved,
}: {
  patientId: number;
  role: NurseType;
  onSaved: () => void;
}) {
  const [body, setBody] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) return;
    try {
      await addNote(patientId, role, body.trim());
      setBody("");
      onSaved();
    } catch {
      alert("Could not save the note. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={`Add a note as ${role}`}
        className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
      >
        Add note
      </button>
    </form>
  );
}
