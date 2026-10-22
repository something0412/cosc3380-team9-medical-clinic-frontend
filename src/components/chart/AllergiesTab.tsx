import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiErrorMessage } from "../../api";
import { addAllergy, getAllergyTypes, removeAllergy, updateAllergy } from "../../services/nursingApi";
import type { Allergy, AllergyType } from "../../types";

const SEVERITIES: Allergy["severity"][] = ["Mild", "Moderate", "Severe"];
const inputClass = "mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm";

// The patient's active allergies. Nurses can add one (picking the
// allergen from the allergy-type list), change its reaction or severity,
// or remove it. Removing only marks it inactive.
export function AllergiesTab({
  patientId,
  allergies,
  canEdit,
  onSaved,
}: {
  patientId: number;
  allergies: Allergy[];
  canEdit: boolean;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [types, setTypes] = useState<AllergyType[]>([]);
  // The allergy being edited; null = the form adds a new one.
  const [editing, setEditing] = useState<Allergy | null>(null);
  const [allergyTypeId, setAllergyTypeId] = useState("");
  const [reaction, setReaction] = useState("");
  const [severity, setSeverity] = useState<Allergy["severity"]>("Mild");

  useEffect(() => {
    if (!canEdit) return;
    getAllergyTypes()
      .then(setTypes)
      .catch(() => setTypes([]));
  }, [canEdit]);

  function resetForm() {
    setEditing(null);
    setAllergyTypeId("");
    setReaction("");
    setSeverity("Mild");
  }

  function startEdit(allergy: Allergy) {
    setEditing(allergy);
    setReaction(allergy.reaction ?? "");
    setSeverity(allergy.severity);
  }

  async function run(action: () => Promise<void>, failure: string) {
    try {
      await action();
      resetForm();
      onSaved();
    } catch (err) {
      alert(`${failure}: ${apiErrorMessage(err)}`);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    run(
      () =>
        editing
          ? updateAllergy(editing.allergyId, { reaction, severity })
          : addAllergy(patientId, { allergyTypeId: Number(allergyTypeId), reaction, severity }),
      "Could not save allergy",
    );
  }

  return (
    <div className="space-y-3">
      {allergies.length === 0 ? (
        <p className="text-sm text-gray-500">No known allergies.</p>
      ) : (
        <ul className="space-y-2">
          {allergies.map((a) => (
            <li
              key={a.allergyId}
              className={`flex flex-wrap items-center justify-between gap-2 rounded border p-2 text-sm ${
                a.severity === "Severe" ? "border-red-300 bg-red-50 font-semibold text-red-900" : "border-gray-200"
              }`}
            >
              <span>
                {a.allergen} — {a.severity}
                {a.reaction && ` (${a.reaction})`}
                {a.category && <span className="ml-2 text-xs font-normal text-gray-500">{a.category}</span>}
              </span>
              {canEdit && user && (
                <span className="flex gap-3 font-normal">
                  <button type="button" onClick={() => startEdit(a)} className="text-blue-700 hover:underline">
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => run(() => removeAllergy(a.allergyId), "Could not remove allergy")}
                    className="text-blue-700 hover:underline"
                  >
                    Remove
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <form onSubmit={handleSubmit} className="grid gap-2 rounded border border-gray-200 bg-gray-50 p-3 sm:grid-cols-3">
          <h4 className="text-sm font-semibold text-gray-900 sm:col-span-3">
            {editing ? `Edit ${editing.allergen}` : "Add allergy"}
          </h4>
          {!editing && (
            <label className="text-xs text-gray-700">
              Allergen
              <select required value={allergyTypeId} onChange={(e) => setAllergyTypeId(e.target.value)} className={inputClass}>
                <option value="">Select…</option>
                {types.map((t) => (
                  <option key={t.allergyTypeId} value={t.allergyTypeId}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="text-xs text-gray-700">
            Reaction
            <input value={reaction} onChange={(e) => setReaction(e.target.value)} placeholder="e.g. Hives" className={inputClass} />
          </label>
          <label className="text-xs text-gray-700">
            Severity
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Allergy["severity"])}
              className={inputClass}
            >
              {SEVERITIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <div className="flex gap-3 sm:col-span-3">
            <button type="submit" className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800">
              {editing ? "Save allergy" : "Add allergy"}
            </button>
            {editing && (
              <button type="button" onClick={resetForm} className="text-sm text-blue-700 hover:underline">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
