import { PrintReport, ReportSection, ReportTable } from "./PrintReport";
import type { Vitals } from "./VitalsTable";
import { formatId } from "../utils/id";

export interface VisitSummaryData {
  appointmentId: number;
  date: string;
  startTime: string;
  status: string;
  doctorName: string;
  specialty: string;
  officeName: string;
  patientId: number;
  patientName: string;
  summary: { visitReason: string | null; notes: string | null } | null;
  diagnoses: { visitDiagnosisId: number; name: string; reasoning: string | null }[];
  vitals: Vitals[];
  prescriptions: { prescriptionItemId: number; medicationName: string; dosage: string; instructions: string | null; durationDays: number | null; isActive: boolean }[];
}

// a reading, or a dash when it wasn't taken
const reading = (value: number | null, unit = "") => (value == null ? "—" : `${value}${unit}`);

// the printable visit summary, used by the doctor's visit page and the patient's records page
export function VisitSummaryReport({ visit }: { visit: VisitSummaryData }) {
  return (
    <PrintReport title="Visit Summary" subtitle={`${visit.date} at ${visit.startTime} · ${visit.status}`}>
      <ReportSection title="Visit">
        <ReportTable
          headers={["Patient", "Doctor", "Specialty", "Office"]}
          rows={[[`${visit.patientName} (ID ${formatId(visit.patientId)})`, `Dr. ${visit.doctorName}`, visit.specialty, visit.officeName]]}
        />
      </ReportSection>

      <ReportSection title="Reason for Visit and Notes">
        {visit.summary ? (
          <>
            <p><span className="font-medium">Reason for visit:</span> {visit.summary.visitReason ?? "—"}</p>
            {visit.summary.notes && <p className="mt-2 whitespace-pre-wrap">{visit.summary.notes}</p>}
          </>
        ) : (
          <p className="text-slate-500">No summary was written for this visit.</p>
        )}
      </ReportSection>

      <ReportSection title="Diagnoses">
        {visit.diagnoses.length === 0 ? (
          <p className="text-slate-500">No diagnoses.</p>
        ) : (
          <ReportTable headers={["Diagnosis", "Reasoning"]} rows={visit.diagnoses.map((d) => [d.name, d.reasoning ?? "—"])} />
        )}
      </ReportSection>

      <ReportSection title="Vitals">
        {visit.vitals.length === 0 ? (
          <p className="text-slate-500">No vitals recorded.</p>
        ) : (
          <ReportTable
            headers={["Taken", "Temp", "Heart Rate", "Blood Pressure", "Breathing", "Oxygen", "Weight", "Height"]}
            rows={visit.vitals.map((v) => [
              v.recordedAt,
              reading(v.temperature, " °F"),
              reading(v.heartRate, " bpm"),
              v.systolic == null && v.diastolic == null ? "—" : `${v.systolic ?? "—"}/${v.diastolic ?? "—"}`,
              reading(v.respiratoryRate, "/min"),
              reading(v.oxygenSaturation, "%"),
              reading(v.weight, " lb"),
              reading(v.height, " in"),
            ])}
          />
        )}
      </ReportSection>

      <ReportSection title="Prescriptions">
        {visit.prescriptions.length === 0 ? (
          <p className="text-slate-500">No prescriptions written at this visit.</p>
        ) : (
          <ReportTable
            headers={["Medication", "Dosage", "Instructions", "Days", "Status"]}
            rows={visit.prescriptions.map((p) => [
              p.medicationName,
              p.dosage,
              p.instructions ?? "—",
              p.durationDays ?? "—",
              p.isActive ? "Active" : "Stopped",
            ])}
          />
        )}
      </ReportSection>
    </PrintReport>
  );
}
