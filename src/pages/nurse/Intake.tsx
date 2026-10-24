import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { ErrorText, Field } from "../../components/FormControls";
import { InfoGrid, InfoItem, PrimaryButton, Section, StatusBadge, SuccessText } from "../../components/ProfileUI";
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

interface IntakeData {
  appointmentId: number;
  date: string;
  time: string;
  status: string;
  doctorName: string;
  specialty: string;
  patientId: number;
  patientName: string;
  dob: string;
  gender: string | null;
  canRecordVitals: boolean;
  allergies: { allergyId: number; allergen: string; reaction: string | null; severity: string }[];
  homeMedications: { homeMedicationId: number; name: string; dosage: string | null; frequency: string | null }[];
  vitals: Vitals[];
}

// cell colors for flagged readings
const FLAG_STYLE = {
  critical: "bg-red-100 font-bold text-red-800",
  abnormal: "bg-orange-50 font-medium text-orange-800",
};

export function NurseIntake() {
  const { appointmentId } = useParams();
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
        temperature,
        heartRate,
        systolic,
        diastolic,
        respiratoryRate,
        oxygenSaturation,
        weight,
        height,
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

  if (error && !intake) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Link to="/staff/nurse/today" className="text-sm text-blue-600 hover:underline">← Back to today's patients</Link>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!intake) return <p>Loading intake...</p>;

  // critical readings in the latest vitals
  const latest = intake.vitals[0];
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
        <Link to="/staff/nurse/today" className="text-sm text-blue-600 hover:underline">← Back to today's patients</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{intake.patientName}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-gray-600">
          {intake.date} · {intake.time} · Dr. {intake.doctorName} · {intake.specialty}
          <StatusBadge status={intake.status} />
        </p>
      </div>

      {criticalReadings.length > 0 && (
        <div className="rounded-lg border-2 border-red-500 bg-red-50 p-4 text-red-900">
          <p className="text-lg font-bold">🚨 Critical vitals: tell the doctor now</p>
          <p className="mt-1">{criticalReadings.join(" · ")}</p>
          <p className="mt-1 text-sm">Recorded {latest.recordedAt} by {latest.recordedBy}</p>
        </div>
      )}

      {intake.allergies.some((a) => a.severity === "Severe") && (
        <div className="rounded-lg border-2 border-orange-400 bg-orange-50 p-4 text-orange-900">
          <p className="font-bold">⚠️ Severe allergies</p>
          <p className="mt-1">
            {intake.allergies.filter((a) => a.severity === "Severe").map((a) => a.allergen).join(", ")}
          </p>
        </div>
      )}

      <Section
        title="Patient"
        action={<Link to={`/staff/nurse/patients/${intake.patientId}`} className="text-sm text-blue-600 hover:underline">Open chart</Link>}
      >
        <InfoGrid>
          <InfoItem label="Patient ID" value={formatId(intake.patientId)} />
          <InfoItem label="Date of Birth" value={intake.dob} />
          <InfoItem label="Gender" value={intake.gender} />
        </InfoGrid>
      </Section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Allergies">
          {intake.allergies.length === 0 ? (
            <p className="text-gray-500">No known allergies.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {intake.allergies.map((a) => (
                <li key={a.allergyId}>
                  <span className="font-medium text-gray-900">{a.allergen}</span> · {a.severity}
                  {a.reaction && <span className="text-gray-600"> · {a.reaction}</span>}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Home Medications">
          {intake.homeMedications.length === 0 ? (
            <p className="text-gray-500">No home medications.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {intake.homeMedications.map((m) => (
                <li key={m.homeMedicationId}>
                  <span className="font-medium text-gray-900">{m.name}</span>
                  {m.dosage && ` · ${m.dosage}`}
                  {m.frequency && ` · ${m.frequency}`}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
      <p className="-mt-3 text-sm text-gray-500">To add or remove allergies and home medications, open the patient's chart.</p>

      <Section title="Vitals for This Visit">
        {intake.vitals.length === 0 ? (
          <p className="text-gray-500">No vitals recorded for this visit yet.</p>
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
                {intake.vitals.map((v) => (
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

      <Section title="Record Vitals">
        {!intake.canRecordVitals ? (
          <p className="text-gray-500">Vitals can only be recorded on the day of the visit or after.</p>
        ) : (
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
            <p className="text-xs text-gray-500">Leave a box empty if that reading wasn't taken.</p>
            <ErrorText message={formError} />
            <SuccessText message={success} />
            <PrimaryButton disabled={saving}>{saving ? "Saving..." : "Save Vitals"}</PrimaryButton>
          </form>
        )}
      </Section>
    </div>
  );
}
