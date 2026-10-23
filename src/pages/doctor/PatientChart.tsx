import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { ErrorText, Field, SelectField } from "../../components/FormControls";
import { Modal } from "../../components/Modal";
import { FormActions, InfoGrid, InfoItem, SecondaryButton, Section, StatusBadge, TextButton } from "../../components/ProfileUI";
import { formatId } from "../../utils/id";

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

interface Chart {
  patientId: number;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  insurance: { provider: string; policyNumber: string; status: string } | null;
  missingForms: string[];
  allergies: { allergyId: number; allergen: string; reaction: string | null; severity: string }[];
  homeMedications: { homeMedicationId: number; name: string; dosage: string | null; frequency: string | null }[];
  vitals: Vitals[];
  visits: {
    appointmentId: number;
    date: string;
    doctorName: string;
    specialty: string;
    status: string;
    visitReason: string | null;
    diagnoses: string | null;
    notes: string | null;
  }[];
  labOrders: {
    labOrderId: number;
    testName: string;
    status: string;
    orderDate: string;
    resultNotes: string | null;
    orderedBy: string;
  }[];
  prescriptions: {
    prescriptionItemId: number;
    medication: string;
    dosage: string;
    instructions: string | null;
    datePrescribed: string;
    prescribedBy: string;
  }[];
}

// cell colors for flagged readings
const FLAG_STYLE = {
  critical: "bg-red-100 font-bold text-red-800",
  abnormal: "bg-orange-50 font-medium text-orange-800",
};

export function DoctorPatientChart() {
  const { id } = useParams();
  const [chart, setChart] = useState<Chart | null>(null);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const [showAllergyForm, setShowAllergyForm] = useState(false);
  const [showMedicationForm, setShowMedicationForm] = useState(false);

  // load patient chart
  useEffect(() => {
    async function loadChart() {
      try {
        const res = await api.get<Chart>(`/api/doctor/patients/${id}`);
        setChart(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    loadChart();
  }, [id, reloadCount]);

  // remove an allergy
  async function removeAllergy(allergyId: number) {
    try {
      await api.patch(`/api/doctor/allergies/${allergyId}/remove`);
      setReloadCount(reloadCount + 1);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  // stop a home medication
  async function stopMedication(homeMedicationId: number) {
    try {
      await api.patch(`/api/doctor/home-medications/${homeMedicationId}/stop`);
      setReloadCount(reloadCount + 1);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  if (error && !chart) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Link to="/doctor/patients" className="text-sm text-blue-600 hover:underline">← Back to patients</Link>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!chart) return <p>Loading chart...</p>;

  // critical readings in the latest vitals
  const latest = chart.vitals[0];
  const criticalReadings: string[] = [];
  if (latest) {
    if (latest.temperatureFlag === "critical") criticalReadings.push(`Temperature ${latest.temperature}°F`);
    if (latest.heartRateFlag === "critical") criticalReadings.push(`Heart rate ${latest.heartRate} bpm`);
    if (latest.bloodPressureFlag === "critical") criticalReadings.push(`Blood pressure ${latest.systolic}/${latest.diastolic}`);
    if (latest.respiratoryRateFlag === "critical") criticalReadings.push(`Breathing ${latest.respiratoryRate}/min`);
    if (latest.oxygenFlag === "critical") criticalReadings.push(`Oxygen ${latest.oxygenSaturation}%`);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link to="/doctor/patients" className="text-sm text-blue-600 hover:underline">← Back to patients</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          {chart.firstName} {chart.lastName}
        </h1>
        <p className="mt-1 text-gray-600">Patient ID {formatId(chart.patientId)}</p>
      </div>

      {criticalReadings.length > 0 && (
        <div className="rounded-lg border-2 border-red-500 bg-red-50 p-4 text-red-900">
          <p className="text-lg font-bold">🚨 Critical vitals</p>
          <p className="mt-1">{criticalReadings.join(" · ")}</p>
          <p className="mt-1 text-sm">Recorded {latest.recordedAt} by {latest.recordedBy}</p>
        </div>
      )}

      {chart.allergies.some((a) => a.severity === "Severe") && (
        <div className="rounded-lg border-2 border-orange-400 bg-orange-50 p-4 text-orange-900">
          <p className="font-bold">⚠️ Severe allergies</p>
          <p className="mt-1">
            {chart.allergies.filter((a) => a.severity === "Severe").map((a) => a.allergen).join(", ")}
          </p>
        </div>
      )}

      {chart.missingForms.length > 0 && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-900">
          <p className="font-medium">Missing required forms: {chart.missingForms.join(", ")}</p>
        </div>
      )}

      {error && <p className="text-red-600">{error}</p>}

      <Section title="Patient Information">
        <InfoGrid>
          <InfoItem label="Date of Birth" value={chart.dob} />
          <InfoItem label="Gender" value={chart.gender} />
          <InfoItem label="Phone" value={chart.phone} />
          <InfoItem label="Email" value={chart.email} />
          <InfoItem label="Address" value={chart.address} />
          <InfoItem
            label="Insurance"
            value={chart.insurance ? (
              <span className="flex items-center gap-2">
                {chart.insurance.provider} · {chart.insurance.policyNumber}
                <StatusBadge status={chart.insurance.status} />
              </span>
            ) : "None on file"}
          />
        </InfoGrid>
      </Section>

      <Section title="Vitals">
        {chart.vitals.length === 0 ? (
          <p className="text-gray-500">No vitals recorded yet.</p>
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
                {chart.vitals.map((v) => (
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Allergies" action={<SecondaryButton onClick={() => setShowAllergyForm(true)}>Add</SecondaryButton>}>
          {chart.allergies.length === 0 ? (
            <p className="text-gray-500">No known allergies.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {chart.allergies.map((a) => (
                <li key={a.allergyId} className="flex justify-between gap-2">
                  <span>
                    <span className="font-medium text-gray-900">{a.allergen}</span> · {a.severity}
                    {a.reaction && <span className="text-gray-600"> · {a.reaction}</span>}
                  </span>
                  <TextButton danger onClick={() => removeAllergy(a.allergyId)}>Remove</TextButton>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Medications" action={<SecondaryButton onClick={() => setShowMedicationForm(true)}>Add</SecondaryButton>}>
          {chart.prescriptions.length === 0 && chart.homeMedications.length === 0 ? (
            <p className="text-gray-500">No medications on file.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {chart.prescriptions.map((m) => (
                <li key={`rx-${m.prescriptionItemId}`}>
                  <span className="font-medium text-gray-900">{m.medication}</span> · {m.dosage}
                  <span className="text-gray-600"> · prescribed by Dr. {m.prescribedBy} on {m.datePrescribed}</span>
                </li>
              ))}
              {chart.homeMedications.map((m) => (
                <li key={`home-${m.homeMedicationId}`} className="flex justify-between gap-2">
                  <span>
                    <span className="font-medium text-gray-900">{m.name}</span>
                    {m.dosage && ` · ${m.dosage}`}
                    {m.frequency && ` · ${m.frequency}`}
                    <span className="text-gray-600"> · home medication</span>
                  </span>
                  <TextButton danger onClick={() => stopMedication(m.homeMedicationId)}>Stop</TextButton>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="Lab Orders">
        {chart.labOrders.length === 0 ? (
          <p className="text-gray-500">No lab orders.</p>
        ) : (
          <ul className="divide-y divide-gray-100 text-sm">
            {chart.labOrders.map((l) => (
              <li key={l.labOrderId} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-900">{l.testName}</span>
                  <StatusBadge status={l.status} />
                  <span className="text-gray-500">{l.orderDate} · Dr. {l.orderedBy}</span>
                </div>
                {l.resultNotes && <p className="mt-1 text-gray-700">{l.resultNotes}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {showAllergyForm && (
        <AddAllergyModal
          patientId={chart.patientId}
          onClose={() => setShowAllergyForm(false)}
          onSaved={() => setReloadCount(reloadCount + 1)}
        />
      )}

      {showMedicationForm && (
        <AddMedicationModal
          patientId={chart.patientId}
          onClose={() => setShowMedicationForm(false)}
          onSaved={() => setReloadCount(reloadCount + 1)}
        />
      )}

      <Section title="Visits">
        {chart.visits.length === 0 ? (
          <p className="text-gray-500">No visits yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 text-sm">
            {chart.visits.map((v) => (
              <li key={v.appointmentId} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-900">{v.date}</span>
                  <StatusBadge status={v.status} />
                  <span className="text-gray-500">Dr. {v.doctorName} · {v.specialty}</span>
                </div>
                {v.visitReason && <p className="mt-1 text-gray-700">Reason for visit: {v.visitReason}</p>}
                {v.diagnoses && <p className="mt-1 text-gray-700">Diagnosis: {v.diagnoses}</p>}
                {v.notes && <p className="mt-1 text-gray-600">{v.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

interface ModalProps {
  patientId: number;
  onClose: () => void;
  onSaved: () => void;
}

function AddAllergyModal({ patientId, onClose, onSaved }: ModalProps) {
  const [types, setTypes] = useState<{ allergyTypeId: number; name: string }[]>([]);
  const [allergyTypeId, setAllergyTypeId] = useState("");
  const [severity, setSeverity] = useState("Mild");
  const [reaction, setReaction] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // load allergy types
  useEffect(() => {
    async function loadTypes() {
      try {
        const res = await api.get("/api/doctor/allergy-types");
        setTypes(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    loadTypes();
  }, []);

  // save the allergy
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post(`/api/doctor/patients/${patientId}/allergies`, {
        allergyTypeId: Number(allergyTypeId),
        severity,
        reaction,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Add Allergy" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectField label="Allergy" required value={allergyTypeId} onChange={(e) => setAllergyTypeId(e.target.value)}>
          <option value="">Select an allergy</option>
          {types.map((t) => (
            <option key={t.allergyTypeId} value={t.allergyTypeId}>{t.name}</option>
          ))}
        </SelectField>
        <SelectField label="Severity" required value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="Mild">Mild</option>
          <option value="Moderate">Moderate</option>
          <option value="Severe">Severe</option>
        </SelectField>
        <Field label="Reaction" placeholder="e.g. Hives" value={reaction} onChange={(e) => setReaction(e.target.value)} />
        <ErrorText message={error} />
        <FormActions saving={saving} onCancel={onClose} saveLabel="Add Allergy" />
      </form>
    </Modal>
  );
}

function AddMedicationModal({ patientId, onClose, onSaved }: ModalProps) {
  const [medications, setMedications] = useState<{ medicationId: number; name: string }[]>([]);
  const [medicationId, setMedicationId] = useState("");
  const [medicationName, setMedicationName] = useState("");
  const [category, setCategory] = useState("Prescription");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // load medications
  useEffect(() => {
    async function loadMedications() {
      try {
        const res = await api.get("/api/doctor/medications");
        setMedications(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    loadMedications();
  }, []);

  // save the home medication
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post(`/api/doctor/patients/${patientId}/home-medications`, {
        medicationId: medicationId ? Number(medicationId) : null,
        medicationName,
        category,
        dosage,
        frequency,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Add Home Medication" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectField label="Medication" value={medicationId} onChange={(e) => setMedicationId(e.target.value)}>
          <option value="">Not in the list (type the name below)</option>
          {medications.map((m) => (
            <option key={m.medicationId} value={m.medicationId}>{m.name}</option>
          ))}
        </SelectField>
        {!medicationId && (
          <Field label="Medication Name" required value={medicationName} onChange={(e) => setMedicationName(e.target.value)} />
        )}
        <SelectField label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="Prescription">Prescription</option>
          <option value="OTC">Over the counter</option>
          <option value="Supplement">Supplement</option>
        </SelectField>
        <Field label="Dosage" placeholder="e.g. 500 mg" value={dosage} onChange={(e) => setDosage(e.target.value)} />
        <Field label="Frequency" placeholder="e.g. Twice daily" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
        <ErrorText message={error} />
        <FormActions saving={saving} onCancel={onClose} saveLabel="Add Medication" />
      </form>
    </Modal>
  );
}
