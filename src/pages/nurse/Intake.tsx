import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { AllergiesSection, HomeMedicationsSection, SevereAllergyBanner } from "../../components/ClinicalRecords";
import type { Allergy, HomeMedication, NursingNote } from "../../components/ClinicalRecords";
import { ErrorText, Field } from "../../components/FormControls";
import { PageError, PortalPage } from "../../components/PortalPage";
import { NotAvailable, PrimaryButton, SecondaryButton, Section, StatusText, SuccessText, TextButton, WarningBox } from "../../components/ProfileUI";
import { Modal } from "../../components/Modal";
import { CriticalVitalsBanner } from "../../components/VitalsTable";
import { FLAG_STYLE, vitalsFlags } from "../../utils/vitalsFlags";
import type { Vitals } from "../../components/VitalsTable";
import { useAuth } from "../../context/AuthContext";
import { formatId } from "../../utils/id";

interface IntakeData {
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorName: string;
  specialty: string;
  officeName: string;
  date: string;
  startTime: string;
  status: string;
  checkedIn: boolean;
  editBlockedReason: string | null;
  allergies: Allergy[];
  homeMedications: HomeMedication[];
  missingForms: string[];
  vitals: Vitals[];
  nursingNotes: NursingNote[];
}

// a blank reading is left out, the others are sent as numbers
const reading = (value: string) => (value.trim() === "" ? null : Number(value));

export function NurseIntake() {
  const { appointmentId } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  // go back to the list with the same filters
  const backTo = (location.state as { back?: string } | null)?.back ?? "/staff/nurse/appointments";
  const BACK = { to: backTo, label: "Back to patient appointments" };
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
  // saved vitals stay locked until the nurse confirms they want to edit them
  const [editing, setEditing] = useState(false);
  const [confirmEdit, setConfirmEdit] = useState(false);

  // put the saved readings in the boxes, or empty boxes when there are none
  function fillForm(saved: Vitals | undefined) {
    const text = (value: number | null | undefined) => (value == null ? "" : String(value));
    setTemperature(text(saved?.temperature));
    setHeartRate(text(saved?.heartRate));
    setSystolic(text(saved?.systolic));
    setDiastolic(text(saved?.diastolic));
    setRespiratoryRate(text(saved?.respiratoryRate));
    setOxygenSaturation(text(saved?.oxygenSaturation));
    setWeight(text(saved?.weight));
    setHeight(text(saved?.height));
  }

  // load intake, and show this visit's saved vitals in the form
  useEffect(() => {
    async function loadIntake() {
      try {
        const res = await api.get<IntakeData>(`/api/nurse/appointments/${appointmentId}`);
        setIntake(res.data);
        fillForm(res.data.vitals[0]);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    loadIntake();
  }, [appointmentId, reloadCount]);

  // save vitals: the first save creates the visit's record, later saves replace it
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
      setEditing(false);
      setSuccess("Vitals saved.");
      setReloadCount(reloadCount + 1);
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // stop editing and put the saved readings back
  function cancelEdit() {
    fillForm(intake?.vitals[0]);
    setEditing(false);
    setFormError("");
  }

  if (!intake) {
    return (
      <PortalPage eyebrow="Nursing" title="Patient Intake" back={BACK}>
        {error ? <PageError message={error} /> : <p className="text-slate-500">Loading intake...</p>}
      </PortalPage>
    );
  }

  // the server says why intake can't be edited (wrong day, other office, not checked in)
  const canDocument = !intake.editBlockedReason;
  const reloadIntake = () => setReloadCount(reloadCount + 1);
  // this visit's one vitals record, if it has been saved
  const savedVitals = intake.vitals[0];
  // the boxes can be typed in when there's nothing saved yet, or while editing
  const canType = canDocument && (!savedVitals || editing);

  return (
    <PortalPage
      eyebrow="Nursing"
      title={intake.patientName}
      description={`Patient ID ${formatId(intake.patientId)} · ${intake.date} at ${intake.startTime} · Dr. ${intake.doctorName} · ${intake.specialty} · ${intake.officeName}`}
      back={BACK}
    >
      <p className="text-sm text-slate-600">
        Status: <StatusText status={intake.status === "Scheduled" && intake.checkedIn ? "Checked In" : intake.status} />
      </p>
      {intake.editBlockedReason && (
        <p className="text-sm text-amber-700">
          <span className="font-semibold">View only.</span> {intake.editBlockedReason}
        </p>
      )}

      <CriticalVitalsBanner vitals={intake.vitals} note="tell the doctor now" />
      <SevereAllergyBanner allergies={intake.allergies} />
      {intake.missingForms.length > 0 && (
        <WarningBox>Missing required forms: {intake.missingForms.join(", ")}</WarningBox>
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

      <Section title="Vitals">
        {savedVitals ? (
          <p className="mb-4 text-sm text-slate-600">
            Recorded by {savedVitals.recordedBy} at {savedVitals.recordedAt}
          </p>
        ) : (
          <p className="mb-4 text-sm text-slate-500">No vitals recorded for this visit yet.</p>
        )}

        {/* empty boxes are greyed out when intake can't be edited; saved readings always show clearly */}
        <form onSubmit={handleSubmit} className={canDocument || savedVitals ? "" : "opacity-60"}>
          <fieldset disabled={!canType} className="space-y-4">
            {savedVitals && !editing ? (
              <SavedVitals vitals={savedVitals} />
            ) : (
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
            )}
            <p className="text-xs text-slate-500">
              {!canDocument
                ? intake.editBlockedReason
                : canType
                  ? "Leave a box empty if that reading wasn't taken."
                  : "These vitals are saved. Use Edit Vitals to change them. Red is critical and amber is abnormal."}
            </p>
            <ErrorText message={formError} />
            <SuccessText message={success} />
          </fieldset>

          {/* save the first time; after that edit, then save or cancel */}
          {canDocument && (
            <div className="mt-4 flex gap-2">
              {!savedVitals && <PrimaryButton disabled={saving}>{saving ? "Saving..." : "Save Vitals"}</PrimaryButton>}
              {savedVitals && !editing && (
                <PrimaryButton
                  type="button"
                  onClick={() => {
                    setSuccess("");
                    setConfirmEdit(true);
                  }}
                >
                  Edit Vitals
                </PrimaryButton>
              )}
              {savedVitals && editing && (
                <>
                  <PrimaryButton disabled={saving}>{saving ? "Saving..." : "Save"}</PrimaryButton>
                  <SecondaryButton disabled={saving} onClick={cancelEdit}>Cancel</SecondaryButton>
                </>
              )}
            </div>
          )}
        </form>
      </Section>

      {confirmEdit && (
        <Modal title="Edit Vitals" onClose={() => setConfirmEdit(false)}>
          <p className="text-sm text-slate-700">
            Are you sure you want to edit this record? Your old record can't be recovered after the change.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <SecondaryButton onClick={() => setConfirmEdit(false)}>Cancel</SecondaryButton>
            <PrimaryButton
              type="button"
              onClick={() => {
                setEditing(true);
                setConfirmEdit(false);
              }}
            >
              Continue
            </PrimaryButton>
          </div>
        </Modal>
      )}

      <NursingNotesSection
        appointmentId={intake.appointmentId}
        notes={intake.nursingNotes}
        myId={user?.id ?? 0}
        canWrite={canDocument}
        blockedReason={intake.editBlockedReason}
        onChanged={reloadIntake}
      />
    </PortalPage>
  );
}

// one saved reading: the number in plain text, N/A when it wasn't taken, red or amber when out of range
function SavedReading({ label, value, flag }: { label: string; value: string | null; flag?: "critical" | "abnormal" | null }) {
  return (
    <div className={`rounded-lg px-3 py-2 ${flag ? FLAG_STYLE[flag] : ""}`}>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className={`mt-1 text-lg ${flag ? "" : "font-semibold text-slate-900"}`}>{value ?? <NotAvailable />}</p>
    </div>
  );
}

// the visit's saved vitals, shown as plain numbers instead of locked boxes
function SavedVitals({ vitals }: { vitals: Vitals }) {
  const flags = vitalsFlags(vitals);
  const shown = (value: number | null, unit = "") => (value == null ? null : `${value}${unit}`);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SavedReading label="Temperature (°F)" value={shown(vitals.temperature)} flag={flags.temperature} />
      <SavedReading label="Heart Rate (bpm)" value={shown(vitals.heartRate)} flag={flags.heartRate} />
      <SavedReading label="Systolic BP" value={shown(vitals.systolic)} flag={flags.bloodPressure} />
      <SavedReading label="Diastolic BP" value={shown(vitals.diastolic)} flag={flags.bloodPressure} />
      <SavedReading label="Breathing (per min)" value={shown(vitals.respiratoryRate)} flag={flags.breathing} />
      <SavedReading label="Oxygen (%)" value={shown(vitals.oxygenSaturation, "%")} flag={flags.oxygen} />
      <SavedReading label="Weight (lb)" value={shown(vitals.weight)} />
      <SavedReading label="Height (in)" value={shown(vitals.height)} />
    </div>
  );
}

function NursingNotesSection({
  appointmentId,
  notes,
  myId,
  canWrite,
  blockedReason,
  onChanged,
}: {
  appointmentId: number;
  notes: NursingNote[];
  myId: number;
  canWrite: boolean;
  blockedReason: string | null;
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
                    className="w-full rounded-lg px-3 py-2 text-sm shadow-field focus:outline-none"
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

      <form onSubmit={addNote} className={`mt-4 border-t border-slate-100 pt-4 ${canWrite ? "" : "opacity-60"}`}>
        <fieldset disabled={!canWrite} className="space-y-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Add a note</span>
            <textarea
              required
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="e.g. Patient reports dizziness since this morning"
              className="w-full rounded-lg px-3 py-2 text-sm shadow-field focus:outline-none"
            />
          </label>
          {blockedReason && <p className="text-xs text-slate-500">{blockedReason}</p>}
          <PrimaryButton disabled={saving || !canWrite}>{saving ? "Saving..." : "Add Note"}</PrimaryButton>
        </fieldset>
      </form>
      <ErrorText message={error} />
    </Section>
  );
}
