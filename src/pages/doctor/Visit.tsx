import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { AllergiesSection, HomeMedicationsSection, NursingNotesList, SevereAllergyBanner } from "../../components/ClinicalRecords";
import type { Allergy, HomeMedication, NursingNote } from "../../components/ClinicalRecords";
import { ErrorText, Field, SelectField } from "../../components/FormControls";
import { PageError, PortalPage } from "../../components/PortalPage";
import { printReport } from "../../utils/printReport";
import { PrimaryButton, SecondaryButton, Section, StatusBadge, SuccessText, TextButton } from "../../components/ProfileUI";
import { VisitSummaryReport } from "../../components/VisitSummaryReport";
import { CriticalVitalsBanner, VitalsTable } from "../../components/VitalsTable";
import type { Vitals } from "../../components/VitalsTable";

interface VisitData {
  appointmentId: number;
  date: string;
  startTime: string;
  status: string;
  checkedIn: boolean;
  doctorName: string;
  specialty: string;
  officeName: string;
  patientId: number;
  patientName: string;
  summary: { visitReason: string | null; notes: string | null; recordedBy: string } | null;
  diagnoses: { visitDiagnosisId: number; name: string; reasoning: string | null; recordedBy: string; createdAt: string }[];
  vitals: Vitals[];
  nursingNotes: NursingNote[];
  prescriptions: {
    prescriptionItemId: number;
    medicationName: string;
    dosage: string;
    instructions: string | null;
    durationDays: number | null;
    isActive: boolean;
  }[];
  allergies: Allergy[];
  homeMedications: HomeMedication[];
  insurance: { provider: string; status: string } | null;
  missingForms: string[];
}

interface Medication {
  medicationId: number;
  name: string;
}

const BACK = { to: "/doctor/appointments", label: "Back to appointments" };

export function DoctorVisit() {
  const { id } = useParams();
  const [visit, setVisit] = useState<VisitData | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  // visit summary form
  const [visitReason, setVisitReason] = useState("");
  const [notes, setNotes] = useState("");
  const [summaryMessage, setSummaryMessage] = useState("");
  const [summaryError, setSummaryError] = useState("");

  // new diagnoses form
  const [newDiagnoses, setNewDiagnoses] = useState<{ name: string; reasoning: string }[]>([]);
  const [diagnosisError, setDiagnosisError] = useState("");

  // prescription form
  const [medicationId, setMedicationId] = useState("");
  const [dosage, setDosage] = useState("");
  const [instructions, setInstructions] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [rxError, setRxError] = useState("");

  // load the visit
  useEffect(() => {
    async function loadVisit() {
      try {
        const res = await api.get<VisitData>(`/api/doctor/appointments/${id}`);
        setVisit(res.data);
        setVisitReason(res.data.summary?.visitReason ?? "");
        setNotes(res.data.summary?.notes ?? "");
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    loadVisit();
  }, [id, reloadCount]);

  // load medications for the prescription form
  useEffect(() => {
    async function loadMedications() {
      try {
        const res = await api.get<Medication[]>("/api/doctor/medications");
        setMedications(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    loadMedications();
  }, []);

  // change one new diagnosis slot
  function updateDiagnosis(index: number, field: "name" | "reasoning", value: string) {
    setNewDiagnoses(newDiagnoses.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  }

  // save reason for visit and notes
  async function saveSummary(e: FormEvent) {
    e.preventDefault();
    setSummaryError("");
    setSummaryMessage("");
    try {
      await api.put(`/api/doctor/appointments/${id}/summary`, { visitReason, notes });
      setSummaryMessage("Visit summary saved.");
      setReloadCount(reloadCount + 1);
    } catch (err) {
      setSummaryError(apiErrorMessage(err));
    }
  }

  // add the new diagnoses to the visit
  async function saveDiagnoses(e: FormEvent) {
    e.preventDefault();
    setDiagnosisError("");
    try {
      await api.post(`/api/doctor/appointments/${id}/diagnoses`, { diagnoses: newDiagnoses });
      setNewDiagnoses([]);
      setReloadCount(reloadCount + 1);
    } catch (err) {
      setDiagnosisError(apiErrorMessage(err));
    }
  }

  // remove a diagnosis added by mistake
  async function removeDiagnosis(diagnosisId: number, name: string) {
    if (!window.confirm(`Remove the diagnosis "${name}" from this visit?`)) return;
    setDiagnosisError("");
    try {
      await api.patch(`/api/doctor/diagnoses/${diagnosisId}/remove`);
      setReloadCount(reloadCount + 1);
    } catch (err) {
      setDiagnosisError(apiErrorMessage(err));
    }
  }

  // write a prescription with one medication
  async function addPrescription(e: FormEvent) {
    e.preventDefault();
    setRxError("");
    try {
      await api.post(`/api/doctor/appointments/${id}/prescriptions`, {
        items: [
          {
            medicationId: Number(medicationId),
            dosage,
            instructions,
            durationDays: durationDays ? Number(durationDays) : null,
          },
        ],
      });
      setMedicationId("");
      setDosage("");
      setInstructions("");
      setDurationDays("");
      setReloadCount(reloadCount + 1);
    } catch (err) {
      setRxError(apiErrorMessage(err));
    }
  }

  // stop a prescription
  async function stopPrescription(itemId: number) {
    if (!window.confirm("Stop this medication?")) return;
    try {
      await api.patch(`/api/doctor/prescription-items/${itemId}/stop`);
      setReloadCount(reloadCount + 1);
    } catch (err) {
      setRxError(apiErrorMessage(err));
    }
  }

  if (!visit) {
    return (
      <PortalPage eyebrow="Doctor" title="Visit" back={BACK}>
        {error ? <PageError message={error} /> : <p className="text-slate-500">Loading visit...</p>}
      </PortalPage>
    );
  }

  // care only happened once the patient checked in, so only those visits can be documented
  const canWrite = visit.status === "Completed" || (visit.status === "Scheduled" && visit.checkedIn);
  const reloadVisit = () => setReloadCount(reloadCount + 1);

  return (
    <PortalPage
      eyebrow="Doctor"
      title={`Visit with ${visit.patientName}`}
      description={`${visit.date} at ${visit.startTime} · ${visit.specialty} · ${visit.officeName}`}
      back={BACK}
      actions={
        <div className="flex items-center gap-4">
          <Link to={`/doctor/patients/${visit.patientId}`} className="text-sm font-medium text-navy hover:text-teal-700 hover:underline">
            Open full chart
          </Link>
          <SecondaryButton onClick={() => printReport(`Visit Summary ${visit.patientName} ${visit.date}`)}>Download PDF</SecondaryButton>
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <StatusBadge status={visit.status === "Scheduled" && visit.checkedIn ? "Checked In" : visit.status} />
        <span className="text-slate-600">
          Insurance: {visit.insurance ? `${visit.insurance.provider} (${visit.insurance.status})` : "None on file"}
        </span>
      </div>

      <PageError message={error} />

      {!canWrite && visit.status === "Scheduled" && (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          The patient hasn't checked in yet. Notes, diagnoses and prescriptions open once the front desk checks them in, and the front
          desk checks them out when the visit is done.
        </p>
      )}

      <CriticalVitalsBanner vitals={visit.vitals} note="at this visit" />
      <SevereAllergyBanner allergies={visit.allergies} />
      {visit.missingForms.length > 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Missing required forms: {visit.missingForms.join(", ")}
        </p>
      )}

      <Section title="Vitals for This Visit">
        <VitalsTable vitals={visit.vitals} empty="No vitals recorded for this visit yet. The nurse takes them after check-in." />
      </Section>

      <Section title="Nursing Notes">
        <NursingNotesList notes={visit.nursingNotes} />
      </Section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AllergiesSection base="/api/doctor" patientId={visit.patientId} allergies={visit.allergies} onChanged={reloadVisit} />
        <HomeMedicationsSection base="/api/doctor" patientId={visit.patientId} medications={visit.homeMedications} onChanged={reloadVisit} />
      </div>

      <Section title="Visit Summary">
        {canWrite ? (
          <form onSubmit={saveSummary} className="space-y-4">
            <Field
              label="Reason for Visit"
              required
              placeholder="e.g. Routine checkup"
              value={visitReason}
              onChange={(e) => setVisitReason(e.target.value)}
            />
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </label>
            <ErrorText message={summaryError} />
            <SuccessText message={summaryMessage} />
            <PrimaryButton>Save Summary</PrimaryButton>
          </form>
        ) : visit.summary ? (
          <div className="space-y-2 text-sm">
            <p><span className="font-medium text-slate-900">Reason for Visit:</span> {visit.summary.visitReason ?? "—"}</p>
            {visit.summary.notes && <p className="whitespace-pre-wrap text-slate-700">{visit.summary.notes}</p>}
          </div>
        ) : (
          <p className="text-slate-500">No summary for this visit.</p>
        )}
      </Section>

      <Section title="Diagnoses">
        {visit.diagnoses.length === 0 ? (
          <p className="text-slate-500">No diagnoses yet.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {visit.diagnoses.map((d) => (
              <li key={d.visitDiagnosisId} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-slate-900">{d.name}</p>
                  {canWrite && <TextButton danger onClick={() => removeDiagnosis(d.visitDiagnosisId, d.name)}>Remove</TextButton>}
                </div>
                {d.reasoning && <p className="mt-1 text-slate-700">{d.reasoning}</p>}
                <p className="mt-1 text-xs text-slate-500">{d.recordedBy} · {d.createdAt}</p>
              </li>
            ))}
          </ul>
        )}

        {canWrite && (
          <form onSubmit={saveDiagnoses} className="mt-4 space-y-3">
            {newDiagnoses.map((d, index) => (
              <div key={index} className="space-y-3 rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">New diagnosis {index + 1}</span>
                  <TextButton danger onClick={() => setNewDiagnoses(newDiagnoses.filter((_, i) => i !== index))}>Remove</TextButton>
                </div>
                <Field label="Name" required placeholder="e.g. Type 2 diabetes" value={d.name} onChange={(e) => updateDiagnosis(index, "name", e.target.value)} />
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Reasoning</span>
                  <textarea
                    value={d.reasoning}
                    onChange={(e) => updateDiagnosis(index, "reasoning", e.target.value)}
                    rows={3}
                    placeholder="Why you made this diagnosis"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </label>
              </div>
            ))}
            <ErrorText message={diagnosisError} />
            <div className="flex gap-2">
              <SecondaryButton onClick={() => setNewDiagnoses([...newDiagnoses, { name: "", reasoning: "" }])}>Add Diagnosis</SecondaryButton>
              {newDiagnoses.length > 0 && <PrimaryButton>Save Diagnoses</PrimaryButton>}
            </div>
          </form>
        )}
      </Section>

      <Section title="Prescriptions">
        {visit.prescriptions.length === 0 ? (
          <p className="text-slate-500">No prescriptions written at this visit.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {visit.prescriptions.map((p) => (
              <li key={p.prescriptionItemId} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <span className={`font-medium ${p.isActive ? "text-slate-900" : "text-slate-400 line-through"}`}>{p.medicationName}</span>{" "}
                  · {p.dosage}
                  {p.durationDays && ` · ${p.durationDays} days`}
                  {p.instructions && <p className="text-slate-600">{p.instructions}</p>}
                </div>
                {p.isActive ? (
                  <TextButton danger onClick={() => stopPrescription(p.prescriptionItemId)}>Stop</TextButton>
                ) : (
                  <StatusBadge status="Stopped" />
                )}
              </li>
            ))}
          </ul>
        )}

        {canWrite && (
          <form onSubmit={addPrescription} className="mt-4 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h4 className="font-semibold text-navy">New Prescription</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SelectField label="Medication" required value={medicationId} onChange={(e) => setMedicationId(e.target.value)}>
                <option value="">Select a medication</option>
                {medications.map((m) => (
                  <option key={m.medicationId} value={m.medicationId}>{m.name}</option>
                ))}
              </SelectField>
              <Field label="Dosage" required placeholder="e.g. 10 mg" value={dosage} onChange={(e) => setDosage(e.target.value)} />
              <Field label="Instructions" placeholder="e.g. Take once daily" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
              <Field label="Duration (days)" type="number" min={1} value={durationDays} onChange={(e) => setDurationDays(e.target.value)} />
            </div>
            <ErrorText message={rxError} />
            <PrimaryButton>Add Prescription</PrimaryButton>
          </form>
        )}
      </Section>

      <VisitSummaryReport visit={visit} />
    </PortalPage>
  );
}
