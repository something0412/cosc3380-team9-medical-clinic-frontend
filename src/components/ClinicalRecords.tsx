import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, apiErrorMessage } from "../api";
import { ErrorText, Field, SelectField } from "./FormControls";
import { Modal } from "./Modal";
import { FormActions, SecondaryButton, Section, TextButton } from "./ProfileUI";

export interface Allergy {
  allergyId: number;
  allergyTypeId: number;
  name: string;
  category: string | null;
  reaction: string | null;
  severity: string;
}

export interface HomeMedication {
  homeMedicationId: number;
  medicationId: number | null;
  medicationName: string;
  category: string | null;
  dosage: string | null;
  frequency: string | null;
  startDate: string | null;
}

// "/api/doctor" or "/api/nurse": both portals use the same allergy and home medication routes
type ApiBase = "/api/doctor" | "/api/nurse";

// orange box listing severe allergies
export function SevereAllergyBanner({ allergies }: { allergies: Allergy[] }) {
  const severe = allergies.filter((a) => a.severity === "Severe");
  if (severe.length === 0) return null;
  return (
    <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4 text-amber-900">
      <p className="font-bold">Severe allergies</p>
      <p className="mt-1">{severe.map((a) => a.name).join(", ")}</p>
    </div>
  );
}

interface SectionProps {
  base: ApiBase;
  patientId: number;
  readOnly?: boolean;
  onChanged: () => void;
}

export function AllergiesSection({ base, patientId, allergies, readOnly = false, onChanged }: SectionProps & { allergies: Allergy[] }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Allergy | null>(null);
  const [error, setError] = useState("");

  // remove an allergy
  async function removeAllergy(allergy: Allergy) {
    if (!window.confirm(`Remove ${allergy.name} from the chart?`)) return;
    setError("");
    try {
      await api.patch(`${base}/allergies/${allergy.allergyId}/remove`);
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <Section title="Allergies" action={!readOnly && <SecondaryButton onClick={() => setAdding(true)}>Add</SecondaryButton>}>
      {allergies.length === 0 ? (
        <p className="text-slate-500">No known allergies.</p>
      ) : (
        <ul className="divide-y divide-slate-100 text-sm">
          {allergies.map((a) => (
            <li key={a.allergyId} className="flex items-center justify-between gap-2 py-2">
              <span>
                <span className="font-medium text-slate-900">{a.name}</span>{" "}
                <span className={`font-medium ${a.severity === "Severe" ? "text-red-600" : a.severity === "Mild" ? "text-yellow-600" : "text-slate-500"}`}>
                  {a.severity}
                </span>
                {a.reaction && <span className="text-slate-600"> · {a.reaction}</span>}
              </span>
              {!readOnly && (
                <span className="flex gap-3">
                  <TextButton onClick={() => setEditing(a)}>Edit</TextButton>
                  <TextButton danger onClick={() => removeAllergy(a)}>Remove</TextButton>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <ErrorText message={error} />

      {adding && <AllergyModal base={base} patientId={patientId} onClose={() => setAdding(false)} onSaved={onChanged} />}
      {editing && <AllergyModal base={base} patientId={patientId} allergy={editing} onClose={() => setEditing(null)} onSaved={onChanged} />}
    </Section>
  );
}

function AllergyModal({ base, patientId, allergy, onClose, onSaved }: { base: ApiBase; patientId: number; allergy?: Allergy; onClose: () => void; onSaved: () => void }) {
  const [types, setTypes] = useState<{ allergyTypeId: number; name: string }[]>([]);
  const [allergyTypeId, setAllergyTypeId] = useState("");
  const [severity, setSeverity] = useState(allergy?.severity ?? "Mild");
  const [reaction, setReaction] = useState(allergy?.reaction ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // load allergy types (only needed when adding)
  useEffect(() => {
    async function loadTypes() {
      try {
        const res = await api.get(`${base}/allergy-types`);
        setTypes(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    if (!allergy) loadTypes();
  }, [base, allergy]);

  // add the allergy, or save the changes to it
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (allergy) {
        await api.patch(`${base}/allergies/${allergy.allergyId}`, { severity, reaction });
      } else {
        await api.post(`${base}/patients/${patientId}/allergies`, { allergyTypeId: Number(allergyTypeId), severity, reaction });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={allergy ? `Edit ${allergy.name} Allergy` : "Add Allergy"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!allergy && (
          <SelectField label="Allergy" required value={allergyTypeId} onChange={(e) => setAllergyTypeId(e.target.value)}>
            <option value="">Select an allergy</option>
            {types.map((t) => (
              <option key={t.allergyTypeId} value={t.allergyTypeId}>{t.name}</option>
            ))}
          </SelectField>
        )}
        <SelectField label="Severity" required value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="Mild">Mild</option>
          <option value="Moderate">Moderate</option>
          <option value="Severe">Severe</option>
        </SelectField>
        <Field label="Reaction" placeholder="e.g. Hives" value={reaction} onChange={(e) => setReaction(e.target.value)} />
        <ErrorText message={error} />
        <FormActions saving={saving} onCancel={onClose} saveLabel={allergy ? "Save" : "Add Allergy"} />
      </form>
    </Modal>
  );
}

export function HomeMedicationsSection({ base, patientId, medications, readOnly = false, onChanged }: SectionProps & { medications: HomeMedication[] }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<HomeMedication | null>(null);
  const [error, setError] = useState("");

  // stop a home medication
  async function stopMedication(medication: HomeMedication) {
    if (!window.confirm(`Mark ${medication.medicationName} as stopped?`)) return;
    setError("");
    try {
      await api.patch(`${base}/home-medications/${medication.homeMedicationId}/stop`);
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <Section title="Home Medications" action={!readOnly && <SecondaryButton onClick={() => setAdding(true)}>Add</SecondaryButton>}>
      {medications.length === 0 ? (
        <p className="text-slate-500">No home medications.</p>
      ) : (
        <ul className="divide-y divide-slate-100 text-sm">
          {medications.map((m) => (
            <li key={m.homeMedicationId} className="flex items-center justify-between gap-2 py-2">
              <span>
                <span className="font-medium text-slate-900">{m.medicationName}</span>
                {m.dosage && ` · ${m.dosage}`}
                {m.frequency && ` · ${m.frequency}`}
                {m.category && <span className="text-slate-500"> · {m.category}</span>}
              </span>
              {!readOnly && (
                <span className="flex gap-3">
                  <TextButton onClick={() => setEditing(m)}>Edit</TextButton>
                  <TextButton danger onClick={() => stopMedication(m)}>Stop</TextButton>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <ErrorText message={error} />

      {adding && <MedicationModal base={base} patientId={patientId} onClose={() => setAdding(false)} onSaved={onChanged} />}
      {editing && <MedicationModal base={base} patientId={patientId} medication={editing} onClose={() => setEditing(null)} onSaved={onChanged} />}
    </Section>
  );
}

function MedicationModal({
  base,
  patientId,
  medication,
  onClose,
  onSaved,
}: {
  base: ApiBase;
  patientId: number;
  medication?: HomeMedication;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [medications, setMedications] = useState<{ medicationId: number; name: string }[]>([]);
  const [medicationId, setMedicationId] = useState("");
  const [medicationName, setMedicationName] = useState("");
  const [category, setCategory] = useState(medication?.category ?? "Prescription");
  const [dosage, setDosage] = useState(medication?.dosage ?? "");
  const [frequency, setFrequency] = useState(medication?.frequency ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // load medications (only needed when adding)
  useEffect(() => {
    async function loadMedications() {
      try {
        const res = await api.get(`${base}/medications`);
        setMedications(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    if (!medication) loadMedications();
  }, [base, medication]);

  // add the home medication, or save the changes to it
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (medication) {
        await api.patch(`${base}/home-medications/${medication.homeMedicationId}`, { category, dosage, frequency });
      } else {
        await api.post(`${base}/patients/${patientId}/home-medications`, {
          medicationId: medicationId ? Number(medicationId) : null,
          medicationName,
          category,
          dosage,
          frequency,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={medication ? `Edit ${medication.medicationName}` : "Add Home Medication"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!medication && (
          <>
            <SelectField label="Medication" value={medicationId} onChange={(e) => setMedicationId(e.target.value)}>
              <option value="">Not in the list (type the name below)</option>
              {medications.map((m) => (
                <option key={m.medicationId} value={m.medicationId}>{m.name}</option>
              ))}
            </SelectField>
            {!medicationId && (
              <Field label="Medication Name" required value={medicationName} onChange={(e) => setMedicationName(e.target.value)} />
            )}
          </>
        )}
        <SelectField label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="Prescription">Prescription</option>
          <option value="OTC">Over the counter</option>
          <option value="Supplement">Supplement</option>
        </SelectField>
        <Field label="Dosage" placeholder="e.g. 500 mg" value={dosage} onChange={(e) => setDosage(e.target.value)} />
        <Field label="Frequency" placeholder="e.g. Twice daily" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
        <ErrorText message={error} />
        <FormActions saving={saving} onCancel={onClose} saveLabel={medication ? "Save" : "Add Medication"} />
      </form>
    </Modal>
  );
}

export interface NursingNote {
  nursingNoteId: number;
  appointmentId: number;
  note: string;
  recordedById: number;
  recordedBy: string;
  recordedAt: string;
  updatedAt: string | null;
}

// read-only list of nursing notes
export function NursingNotesList({ notes }: { notes: NursingNote[] }) {
  if (notes.length === 0) return <p className="text-slate-500">No nursing notes.</p>;
  return (
    <ul className="divide-y divide-slate-100 text-sm">
      {notes.map((n) => (
        <li key={n.nursingNoteId} className="py-3">
          <p className="whitespace-pre-wrap text-slate-900">{n.note}</p>
          <p className="mt-1 text-xs text-slate-500">
            {n.recordedBy} · {n.recordedAt}
            {n.updatedAt && ` · edited ${n.updatedAt}`}
          </p>
        </li>
      ))}
    </ul>
  );
}
