import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { AllergiesSection, HomeMedicationsSection, SevereAllergyBanner } from "../../components/ClinicalRecords";
import type { Allergy, HomeMedication, NursingNote } from "../../components/ClinicalRecords";
import { ErrorText, Field } from "../../components/FormControls";
import { PageError, PortalPage } from "../../components/PortalPage";
import { PrimaryButton, SecondaryButton, Section, StatusBadge, SuccessText, TextButton } from "../../components/ProfileUI";
import { CriticalVitalsBanner, VitalsTable } from "../../components/VitalsTable";
import type { Vitals } from "../../components/VitalsTable";
import { useAuth } from "../../context/AuthContext";
import { formatId } from "../../utils/id";

interface IntakeData {
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorName: string;
  specialty: string;
  date: string;
  startTime: string;
  status: string;
  checkedIn: boolean;
  allergies: Allergy[];
  homeMedications: HomeMedication[];
  missingForms: string[];
  vitals: Vitals[];
  nursingNotes: NursingNote[];
}

const BACK = { to: "/staff/nurse/today", label: "Back to today's patients" };

// today's date at the clinic as YYYY-MM-DD
const clinicToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });

// a blank reading is left out, the others are sent as numbers
const reading = (value: string) => (value.trim() === "" ? null : Number(value));

export function NurseIntake() {
  const { appointmentId } = useParams();
  const { user } = useAuth();
  const [intake, setIntake] = useState<IntakeData | null>(null);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  // vitals form
  const [temperature, setTemperature] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [respiratoryRate, setRespiratoryRate] = useState("");
  const [oxygenSaturation, setOxygenSaturation] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  // load intake
  useEffect(() => {
    async function loadIntake() {
      try {
        const res = await api.get<IntakeData>(`/api/nurse/appointments/${appointmentId}`);
        setIntake(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    loadIntake();
  }, [appointmentId, reloadCount]);

  // save vitals
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setSuccess("");
    if ((systolic && !diastolic) || (!systolic && diastolic)) {
      setFormError("Enter both blood pressure numbers.");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/api/nurse/appointments/${appointmentId}/vitals`, {
        temperature: reading(temperature),
        heartRate: reading(heartRate),
        systolic: reading(systolic),
        diastolic: reading(diastolic),
        respiratoryRate: reading(respiratoryRate),
        oxygenSaturation: reading(oxygenSaturation),
        weight: reading(weight),
        height: reading(height),
      });
      setTemperature("");
      setHeartRate("");
      setSystolic("");
      setDiastolic("");
      setRespiratoryRate("");
      setOxygenSaturation("");
      setWeight("");
      setHeight("");
      setSuccess("Vitals saved.");
      setReloadCount(reloadCount + 1);
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!intake) {
    return (
      <PortalPage eyebrow="Nursing" title="Patient Intake" back={BACK}>
        {error ? <PageError message={error} /> : <p className="text-slate-500">Loading intake...</p>}
      </PortalPage>
    );
  }

  // nurses document a visit on its day, once the patient is checked in
  const isToday = intake.date === clinicToday();
  const checkedIn = intake.status === "Completed" || (intake.status === "Scheduled" && intake.checkedIn);
  const canDocument = isToday && checkedIn;
  const reloadIntake = () => setReloadCount(reloadCount + 1);

  return (
    <PortalPage
      eyebrow="Nursing"
      title={intake.patientName}
      description={`Patient ID ${formatId(intake.patientId)} · ${intake.date} at ${intake.startTime} · Dr. ${intake.doctorName} · ${intake.specialty}`}
      back={BACK}
      actions={
        <Link to={`/staff/nurse/patients/${intake.patientId}`} className="text-sm font-medium text-navy hover:text-teal-700 hover:underline">
          Open full chart
        </Link>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={intake.status === "Scheduled" && intake.checkedIn ? "Checked In" : intake.status} />
        {!canDocument && (
          <span className="text-sm text-slate-600">
            {!isToday ? "Vitals and notes can only be recorded on the day of the visit." : "The front desk needs to check the patient in first."}
          </span>
        )}
      </div>

      <CriticalVitalsBanner vitals={intake.vitals} note="tell the doctor now" />
      <SevereAllergyBanner allergies={intake.allergies} />
      {intake.missingForms.length > 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Missing required forms: {intake.missingForms.join(", ")}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AllergiesSection base="/api/nurse" patientId={intake.patientId} allergies={intake.allergies} readOnly={!canDocument} onChanged={reloadIntake} />
        <HomeMedicationsSection
          base="/api/nurse"
          patientId={intake.patientId}
          medications={intake.homeMedications}
          readOnly={!canDocument}
          onChanged={reloadIntake}
        />
      </div>

      <Section title="Vitals for This Visit">
        <VitalsTable vitals={intake.vitals} empty="No vitals recorded for this visit yet." />
      </Section>

      {canDocument && (
        <Section title="Record Vitals">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Temperature (°F)" type="number" step="0.1" min="0" value={temperature} onChange={(e) => setTemperature(e.target.value)} />
              <Field label="Heart Rate (bpm)" type="number" min="0" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} />
              <Field label="Systolic BP" type="number" min="0" value={systolic} onChange={(e) => setSystolic(e.target.value)} />
              <Field label="Diastolic BP" type="number" min="0" value={diastolic} onChange={(e) => setDiastolic(e.target.value)} />
              <Field label="Breathing (per min)" type="number" min="0" value={respiratoryRate} onChange={(e) => setRespiratoryRate(e.target.value)} />
              <Field label="Oxygen (%)" type="number" min="0" max="100" value={oxygenSaturation} onChange={(e) => setOxygenSaturation(e.target.value)} />
              <Field label="Weight (lb)" type="number" step="0.1" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} />
              <Field label="Height (in)" type="number" step="0.1" min="0" value={height} onChange={(e) => setHeight(e.target.value)} />
            </div>
            <p className="text-xs text-slate-500">Leave a box empty if that reading wasn't taken.</p>
            <ErrorText message={formError} />
            <SuccessText message={success} />
            <PrimaryButton disabled={saving}>{saving ? "Saving..." : "Save Vitals"}</PrimaryButton>
          </form>
        </Section>
      )}

      <NursingNotesSection
        appointmentId={intake.appointmentId}
        notes={intake.nursingNotes}
        myId={user?.id ?? 0}
        canWrite={canDocument}
        onChanged={reloadIntake}
      />
    </PortalPage>
  );
}

function NursingNotesSection({
  appointmentId,
  notes,
  myId,
  canWrite,
  onChanged,
}: {
  appointmentId: number;
  notes: NursingNote[];
  myId: number;
  canWrite: boolean;
  onChanged: () => void;
}) {
  const [note, setNote] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // add a note
  async function addNote(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post(`/api/nurse/appointments/${appointmentId}/nursing-notes`, { note });
      setNote("");
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // save changes to my note
  async function saveEdit(nursingNoteId: number) {
    setError("");
    setSaving(true);
    try {
      await api.patch(`/api/nurse/nursing-notes/${nursingNoteId}`, { note: editText });
      setEditingId(null);
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title="Nursing Notes">
      {notes.length === 0 ? (
        <p className="text-slate-500">No nursing notes for this visit yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 text-sm">
          {notes.map((n) => (
            <li key={n.nursingNoteId} className="py-3">
              {editingId === n.nursingNoteId ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <PrimaryButton type="button" disabled={saving} onClick={() => saveEdit(n.nursingNoteId)}>Save</PrimaryButton>
                    <SecondaryButton onClick={() => setEditingId(null)} disabled={saving}>Cancel</SecondaryButton>
                  </div>
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-wrap text-slate-900">{n.note}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>
                      {n.recordedBy} · {n.recordedAt}
                      {n.updatedAt && ` · edited ${n.updatedAt}`}
                    </span>
                    {canWrite && n.recordedById === myId && (
                      <TextButton
                        onClick={() => {
                          setEditingId(n.nursingNoteId);
                          setEditText(n.note);
                        }}
                      >
                        Edit
                      </TextButton>
                    )}
                  </p>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {canWrite && (
        <form onSubmit={addNote} className="mt-4 space-y-2 border-t border-slate-100 pt-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Add a note</span>
            <textarea
              required
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="e.g. Patient reports dizziness since this morning"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <PrimaryButton disabled={saving}>{saving ? "Saving..." : "Add Note"}</PrimaryButton>
        </form>
      )}
      <ErrorText message={error} />
    </Section>
  );
}
