import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { ErrorText, Field, SelectField } from "../../components/FormControls";
import { PrimaryButton, SecondaryButton, Section, StatusBadge, SuccessText, TextButton } from "../../components/ProfileUI";

type Flag = "abnormal" | "critical" | null;

interface Vitals {
  vitalsId: number;
  recordedAt: string;
  recordedBy: string;
  temperature: number | null;
  heartRate: number | null;
  systolic: number | null;
  diastolic: number | null;
  respiratoryRate: number | null;
  oxygenSaturation: number | null;
  weight: number | null;
  height: number | null;
  temperatureFlag: Flag;
  heartRateFlag: Flag;
  bloodPressureFlag: Flag;
  respiratoryRateFlag: Flag;
  oxygenFlag: Flag;
}

// cell colors for flagged readings
const FLAG_STYLE = {
  critical: "bg-red-100 font-bold text-red-800",
  abnormal: "bg-orange-50 font-medium text-orange-800",
};

interface VisitData {
  appointmentId: number;
  date: string;
  time: string;
  status: string;
  specialty: string;
  officeName: string;
  patientId: number;
  patientName: string;
  dob: string;
  gender: string | null;
  canFinish: boolean;
  summary: { visitReason: string; notes: string | null } | null;
  diagnoses: { visitDiagnosisId: number; name: string; reasoning: string | null }[];
  vitals: Vitals[];
  prescriptions: {
    prescriptionItemId: number;
    medication: string;
    dosage: string;
    instructions: string | null;
    durationDays: number | null;
    isActive: boolean;
  }[];
  allergies: { allergen: string; severity: string }[];
  insurance: { provider: string; status: string } | null;
  missingForms: string[];
}

interface Medication {
  medicationId: number;
  name: string;
}

export function DoctorVisit() {
  const { id } = useParams();
  const [visit, setVisit] = useState<VisitData | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  // visit summary form
  const [visitReason, setVisitReason] = useState("");
  const [notes, setNotes] = useState("");
  const [diagnoses, setDiagnoses] = useState<{ name: string; reasoning: string }[]>([]);
  const [summaryMessage, setSummaryMessage] = useState("");
  const [summaryError, setSummaryError] = useState("");

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
        setDiagnoses(res.data.diagnoses.map((d) => ({ name: d.name, reasoning: d.reasoning ?? "" })));
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

  // mark completed or no show
  async function updateStatus(status: "Completed" | "No Show") {
    try {
      await api.patch(`/api/doctor/appointments/${id}/status`, { status });
      setReloadCount(reloadCount + 1);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  // add an empty diagnosis slot
  function addDiagnosis() {
    setDiagnoses([...diagnoses, { name: "", reasoning: "" }]);
  }

  // change one diagnosis slot
  function updateDiagnosis(index: number, field: "name" | "reasoning", value: string) {
    setDiagnoses(diagnoses.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  }

  // remove one diagnosis slot
  function removeDiagnosis(index: number) {
    setDiagnoses(diagnoses.filter((_, i) => i !== index));
  }

  // save visit summary
  async function saveSummary(e: FormEvent) {
    e.preventDefault();
    setSummaryError("");
    setSummaryMessage("");
    try {
      await api.put(`/api/doctor/appointments/${id}/summary`, { visitReason, notes, diagnoses });
      setSummaryMessage("Visit summary saved.");
      setReloadCount(reloadCount + 1);
    } catch (err) {
      setSummaryError(apiErrorMessage(err));
    }
  }

  // write a prescription
  async function addPrescription(e: FormEvent) {
    e.preventDefault();
    setRxError("");
    try {
      await api.post(`/api/doctor/appointments/${id}/prescriptions`, {
        medicationId: Number(medicationId),
        dosage,
        instructions,
        durationDays: durationDays ? Number(durationDays) : null,
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
    try {
      await api.patch(`/api/doctor/prescription-items/${itemId}/stop`);
      setReloadCount(reloadCount + 1);
    } catch (err) {
      setRxError(apiErrorMessage(err));
    }
  }

  if (error && !visit) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Link to="/doctor/appointments" className="text-sm text-blue-600 hover:underline">← Back to appointments</Link>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!visit) return <p>Loading visit...</p>;

  const canWrite = visit.status === "Scheduled" || visit.status === "Completed";

  // critical readings in the latest vitals for this visit
  const latest = visit.vitals[0];
  const criticalReadings: string[] = [];
  if (latest) {
    if (latest.temperatureFlag === "critical") criticalReadings.push(`Temperature ${latest.temperature}°F`);
    if (latest.heartRateFlag === "critical") criticalReadings.push(`Heart rate ${latest.heartRate} bpm`);
    if (latest.bloodPressureFlag === "critical") criticalReadings.push(`Blood pressure ${latest.systolic}/${latest.diastolic}`);
    if (latest.respiratoryRateFlag === "critical") criticalReadings.push(`Breathing ${latest.respiratoryRate}/min`);
    if (latest.oxygenFlag === "critical") criticalReadings.push(`Oxygen ${latest.oxygenSaturation}%`);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link to="/doctor/appointments" className="text-sm text-blue-600 hover:underline">← Back to appointments</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Visit with {visit.patientName}</h1>
          <StatusBadge status={visit.status} />
        </div>
        <p className="mt-1 text-gray-600">
          {visit.date} at {visit.time} · {visit.specialty} · {visit.officeName} ·{" "}
          <Link to={`/doctor/patients/${visit.patientId}`} className="text-blue-600 hover:underline">Open full chart</Link>
        </p>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {criticalReadings.length > 0 && (
        <div className="rounded-lg border-2 border-red-500 bg-red-50 p-4 text-red-900">
          <p className="text-lg font-bold">🚨 Critical vitals at this visit</p>
          <p className="mt-1">{criticalReadings.join(" · ")}</p>
          <p className="mt-1 text-sm">Recorded {latest.recordedAt} by {latest.recordedBy}</p>
        </div>
      )}

      {visit.allergies.length > 0 && (
        <div className="rounded-lg border-2 border-orange-400 bg-orange-50 p-4 text-orange-900">
          <p className="font-bold">⚠️ Allergies</p>
          <p className="mt-1">{visit.allergies.map((a) => `${a.allergen} (${a.severity})`).join(", ")}</p>
        </div>
      )}

      {visit.missingForms.length > 0 && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-900">
          <p className="font-medium">Missing required forms: {visit.missingForms.join(", ")}</p>
        </div>
      )}

      <p className="text-sm text-gray-600">
        Insurance: {visit.insurance ? `${visit.insurance.provider} (${visit.insurance.status})` : "None on file"}
      </p>

      {visit.status === "Scheduled" && (
        <Section title="Visit Status">
          {visit.canFinish ? (
            <div className="flex gap-3">
              <PrimaryButton type="button" onClick={() => updateStatus("Completed")}>Mark Completed</PrimaryButton>
              <SecondaryButton onClick={() => updateStatus("No Show")}>Mark No Show</SecondaryButton>
            </div>
          ) : (
            <p className="text-gray-500">This visit is in the future. You can mark it completed on the day of the visit.</p>
          )}
        </Section>
      )}

      <Section title="Vitals for This Visit">
        {visit.vitals.length === 0 ? (
          <p className="text-gray-500">No vitals recorded for this visit yet. The nurse takes them before the patient sees you.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="p-2 font-medium">Recorded</th>
                  <th className="p-2 font-medium">Temp (°F)</th>
                  <th className="p-2 font-medium">Heart Rate</th>
                  <th className="p-2 font-medium">Blood Pressure</th>
                  <th className="p-2 font-medium">Breathing</th>
                  <th className="p-2 font-medium">Oxygen</th>
                  <th className="p-2 font-medium">Weight (lb)</th>
                  <th className="p-2 font-medium">Height (in)</th>
                  <th className="p-2 font-medium">By</th>
                </tr>
              </thead>
              <tbody>
                {visit.vitals.map((v) => (
                  <tr key={v.vitalsId} className="border-b last:border-0">
                    <td className="p-2">{v.recordedAt}</td>
                    <td className={`p-2 ${v.temperatureFlag ? FLAG_STYLE[v.temperatureFlag] : ""}`}>{v.temperature ?? "—"}</td>
                    <td className={`p-2 ${v.heartRateFlag ? FLAG_STYLE[v.heartRateFlag] : ""}`}>{v.heartRate ?? "—"}</td>
                    <td className={`p-2 ${v.bloodPressureFlag ? FLAG_STYLE[v.bloodPressureFlag] : ""}`}>
                      {v.systolic ? `${v.systolic}/${v.diastolic}` : "—"}
                    </td>
                    <td className={`p-2 ${v.respiratoryRateFlag ? FLAG_STYLE[v.respiratoryRateFlag] : ""}`}>{v.respiratoryRate ?? "—"}</td>
                    <td className={`p-2 ${v.oxygenFlag ? FLAG_STYLE[v.oxygenFlag] : ""}`}>
                      {v.oxygenSaturation ? `${v.oxygenSaturation}%` : "—"}
                    </td>
                    <td className="p-2">{v.weight ?? "—"}</td>
                    <td className="p-2">{v.height ?? "—"}</td>
                    <td className="p-2">{v.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-gray-500">
              <span className="rounded bg-red-100 px-1.5 font-bold text-red-800">Red</span> = critical,{" "}
              <span className="rounded bg-orange-50 px-1.5 font-medium text-orange-800">orange</span> = abnormal
            </p>
          </div>
        )}
      </Section>

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

            <div className="space-y-3">
              {diagnoses.map((d, index) => (
                <div key={index} className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Diagnosis {index + 1}</span>
                    <TextButton danger onClick={() => removeDiagnosis(index)}>Remove</TextButton>
                  </div>
                  <Field
                    label="Name"
                    required
                    placeholder="e.g. Diabetes"
                    value={d.name}
                    onChange={(e) => updateDiagnosis(index, "name", e.target.value)}
                  />
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-gray-700">Reasoning</span>
                    <textarea
                      value={d.reasoning}
                      onChange={(e) => updateDiagnosis(index, "reasoning", e.target.value)}
                      rows={3}
                      placeholder="Why you made this diagnosis"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                </div>
              ))}
              <SecondaryButton onClick={addDiagnosis}>+ Add Diagnosis</SecondaryButton>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              />
            </label>
            <ErrorText message={summaryError} />
            <SuccessText message={summaryMessage} />
            <PrimaryButton>Save Summary</PrimaryButton>
          </form>
        ) : visit.summary ? (
          <div className="text-sm">
            <p><span className="font-medium">Reason for Visit:</span> {visit.summary.visitReason}</p>
            {visit.diagnoses.map((d) => (
              <div key={d.visitDiagnosisId} className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="font-medium text-gray-900">{d.name}</p>
                {d.reasoning && <p className="mt-1 text-gray-700">{d.reasoning}</p>}
              </div>
            ))}
            {visit.summary.notes && <p className="mt-3 text-gray-700">{visit.summary.notes}</p>}
          </div>
        ) : (
          <p className="text-gray-500">No summary. This visit was {visit.status.toLowerCase()}.</p>
        )}
      </Section>

      <Section title="Prescriptions">
        {visit.prescriptions.length === 0 ? (
          <p className="text-gray-500">No prescriptions written at this visit.</p>
        ) : (
          <ul className="divide-y divide-gray-100 text-sm">
            {visit.prescriptions.map((p) => (
              <li key={p.prescriptionItemId} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <span className={`font-medium ${p.isActive ? "text-gray-900" : "text-gray-400 line-through"}`}>
                    {p.medication}
                  </span>{" "}
                  · {p.dosage}
                  {p.durationDays && ` · ${p.durationDays} days`}
                  {p.instructions && <p className="text-gray-600">{p.instructions}</p>}
                </div>
                {p.isActive ? (
                  <TextButton danger onClick={() => stopPrescription(p.prescriptionItemId)}>Stop</TextButton>
                ) : (
                  <span className="text-xs text-gray-500">Stopped</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {canWrite && (
          <form onSubmit={addPrescription} className="mt-4 space-y-4 rounded-lg bg-gray-50 p-4">
            <h4 className="font-medium text-gray-900">New Prescription</h4>
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
    </div>
  );
}
