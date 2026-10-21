import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { authErrorMessage } from "../../services/authApi";
import {
  addHomeMedication,
  getMedications,
  stopHomeMedication,
  updateHomeMedication,
} from "../../services/nursingApi";
import type { HomeMedDetails } from "../../services/nursingApi";
import type { HomeMedCategory, MedicationOption, PatientMedication } from "../../types";

const CATEGORIES: HomeMedCategory[] = ["Prescription", "OTC", "Supplement"];
const inputClass = "mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm";
const EMPTY: HomeMedDetails = { category: null, dosage: "", frequency: "" };

// Two lists: home medications (what the patient already takes, which
// nurses record and keep up to date) and prescriptions (written by
// doctors; nurses can only see them).
export function MedicationsTab({
  patientId,
  medications,
  canEdit,
  onSaved,
}: {
  patientId: number;
  medications: PatientMedication[];
  canEdit: boolean;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [options, setOptions] = useState<MedicationOption[]>([]);
  // The home med being edited; null = the form adds a new one.
  const [editing, setEditing] = useState<PatientMedication | null>(null);
  const [medicationId, setMedicationId] = useState(""); // "" = type a name instead
  const [medicationName, setMedicationName] = useState("");
  const [details, setDetails] = useState<HomeMedDetails>(EMPTY);

  useEffect(() => {
    if (!canEdit) return;
    getMedications()
      .then(setOptions)
      .catch(() => setOptions([]));
  }, [canEdit]);

  const homeMeds = medications.filter((m) => m.source === "Home");
  const prescriptions = medications.filter((m) => m.source === "Prescription");

  function resetForm() {
    setEditing(null);
    setMedicationId("");
    setMedicationName("");
    setDetails(EMPTY);
  }

  function startEdit(med: PatientMedication) {
    setEditing(med);
    setDetails({ category: med.category, dosage: med.dosage ?? "", frequency: med.directions ?? "" });
  }

  async function run(action: () => Promise<void>, failure: string) {
    try {
      await action();
      resetForm();
      onSaved();
    } catch (err) {
      alert(`${failure}: ${authErrorMessage(err)}`);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    run(
      () =>
        editing
          ? updateHomeMedication(user.id, editing.id, details)
          : addHomeMedication(user.id, patientId, {
              ...details,
              medicationId: medicationId ? Number(medicationId) : null,
              medicationName,
            }),
      "Could not save medication",
    );
  }

  return (
    <div className="space-y-4">
      <section>
        <h4 className="mb-2 text-sm font-semibold text-gray-900">Home medications</h4>
        {homeMeds.length === 0 ? (
          <p className="text-sm text-gray-500">None recorded.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {homeMeds.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-gray-200 p-2">
                <span>
                  {m.name}
                  {m.dosage && ` ${m.dosage}`}
                  {m.directions && `, ${m.directions}`}
                  <span className="text-gray-500">
                    {m.category && ` · ${m.category}`} · since {m.startDate}
                  </span>
                </span>
                {canEdit && user && (
                  <span className="flex gap-3">
                    <button type="button" onClick={() => startEdit(m)} className="text-blue-700 hover:underline">
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => run(() => stopHomeMedication(user.id, m.id), "Could not update medication")}
                      className="text-blue-700 hover:underline"
                    >
                      Stopped taking
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {canEdit && (
        <form onSubmit={handleSubmit} className="grid gap-2 rounded border border-gray-200 bg-gray-50 p-3 sm:grid-cols-2">
          <h4 className="text-sm font-semibold text-gray-900 sm:col-span-2">
            {editing ? `Edit ${editing.name}` : "Record a home medication"}
          </h4>
          {!editing && (
            <>
              <label className="text-xs text-gray-700">
                Medication
                <select value={medicationId} onChange={(e) => setMedicationId(e.target.value)} className={inputClass}>
                  <option value="">Not in the list — type it</option>
                  {options.map((o) => (
                    <option key={o.medicationId} value={o.medicationId}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </label>
              {!medicationId && (
                <label className="text-xs text-gray-700">
                  Medication name
                  <input
                    required
                    value={medicationName}
                    onChange={(e) => setMedicationName(e.target.value)}
                    className={inputClass}
                  />
                </label>
              )}
            </>
          )}
          <label className="text-xs text-gray-700">
            Category
            <select
              value={details.category ?? ""}
              onChange={(e) => setDetails({ ...details, category: (e.target.value || null) as HomeMedCategory | null })}
              className={inputClass}
            >
              <option value="">—</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-gray-700">
            Dosage
            <input
              value={details.dosage}
              onChange={(e) => setDetails({ ...details, dosage: e.target.value })}
              placeholder="e.g. 10 mg"
              className={inputClass}
            />
          </label>
          <label className="text-xs text-gray-700">
            Frequency
            <input
              value={details.frequency}
              onChange={(e) => setDetails({ ...details, frequency: e.target.value })}
              placeholder="e.g. Daily"
              className={inputClass}
            />
          </label>
          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800">
              {editing ? "Save" : "Record medication"}
            </button>
            {editing && (
              <button type="button" onClick={resetForm} className="text-sm text-blue-700 hover:underline">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <section>
        <h4 className="mb-2 text-sm font-semibold text-gray-900">Prescriptions</h4>
        <p className="mb-2 text-xs text-gray-500">Prescribed by doctors — view only.</p>
        {prescriptions.length === 0 ? (
          <p className="text-sm text-gray-500">No active prescriptions.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {prescriptions.map((m) => (
              <li key={m.id} className="rounded border border-gray-200 p-2">
                {m.name}
                {m.dosage && ` ${m.dosage}`}
                {m.directions && `, ${m.directions}`}
                <span className="text-gray-500"> · since {m.startDate}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
