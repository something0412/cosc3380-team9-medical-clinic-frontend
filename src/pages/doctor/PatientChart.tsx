import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { AllergiesSection, HomeMedicationsSection, NursingNotesList, SevereAllergyBanner } from "../../components/ClinicalRecords";
import type { Allergy, HomeMedication, NursingNote } from "../../components/ClinicalRecords";
import { PageError, PortalPage } from "../../components/PortalPage";
import { InfoGrid, InfoItem, Section, StatusBadge } from "../../components/ProfileUI";
import { CriticalVitalsBanner, VitalsTable } from "../../components/VitalsTable";
import type { Vitals } from "../../components/VitalsTable";
import { formatId } from "../../utils/id";

interface Chart {
  patientId: number;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string | null;
  phone: string;
  assignedToMe: boolean;
  insurance: { provider: string; status: string } | null;
  missingForms: string[];
  allergies: Allergy[];
  homeMedications: HomeMedication[];
  vitals: Vitals[];
  nursingNotes: NursingNote[];
  visits: {
    appointmentId: number;
    date: string;
    doctorName: string;
    specialty: string;
    status: string;
    visitReason: string | null;
    diagnoses: string[];
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
    medicationName: string;
    dosage: string;
    instructions: string | null;
    datePrescribed: string;
    prescriberName: string;
  }[];
}

const BACK = { to: "/doctor/patients", label: "Back to patients" };

export function DoctorPatientChart() {
  const { id } = useParams();
  const [chart, setChart] = useState<Chart | null>(null);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

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

  if (!chart) {
    return (
      <PortalPage eyebrow="Doctor" title="Patient Chart" back={BACK}>
        {error ? <PageError message={error} /> : <p className="text-slate-500">Loading chart...</p>}
      </PortalPage>
    );
  }

  const reloadChart = () => setReloadCount(reloadCount + 1);

  return (
    <PortalPage
      eyebrow="Doctor"
      title={`${chart.firstName} ${chart.lastName}`}
      description={`Patient ID ${formatId(chart.patientId)}${chart.assignedToMe ? " · your assigned patient" : ""}`}
      back={BACK}
    >
      <CriticalVitalsBanner vitals={chart.vitals} />
      <SevereAllergyBanner allergies={chart.allergies} />
      {chart.missingForms.length > 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Missing required forms: {chart.missingForms.join(", ")}
        </p>
      )}

      <Section title="Patient Information">
        <InfoGrid>
          <InfoItem label="Date of Birth" value={chart.dob} />
          <InfoItem label="Gender" value={chart.gender} />
          <InfoItem label="Phone" value={chart.phone} />
          <InfoItem
            label="Insurance"
            value={chart.insurance ? (
              <span className="flex items-center gap-2">
                {chart.insurance.provider}
                <StatusBadge status={chart.insurance.status} />
              </span>
            ) : "None on file"}
          />
        </InfoGrid>
      </Section>

      <Section title="Vitals">
        <VitalsTable vitals={chart.vitals} empty="No vitals recorded yet." />
      </Section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AllergiesSection base="/api/doctor" patientId={chart.patientId} allergies={chart.allergies} onChanged={reloadChart} />
        <HomeMedicationsSection base="/api/doctor" patientId={chart.patientId} medications={chart.homeMedications} onChanged={reloadChart} />
      </div>

      <Section title="Prescriptions">
        {chart.prescriptions.length === 0 ? (
          <p className="text-slate-500">No active prescriptions.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {chart.prescriptions.map((m) => (
              <li key={m.prescriptionItemId} className="py-2">
                <span className="font-medium text-slate-900">{m.medicationName}</span> · {m.dosage}
                {m.instructions && <span className="text-slate-700"> · {m.instructions}</span>}
                <span className="text-slate-500"> · Dr. {m.prescriberName} on {m.datePrescribed}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Nursing Notes">
        <NursingNotesList notes={chart.nursingNotes} />
      </Section>

      <Section title="Lab Orders">
        {chart.labOrders.length === 0 ? (
          <p className="text-slate-500">No lab orders.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {chart.labOrders.map((l) => (
              <li key={l.labOrderId} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">{l.testName}</span>
                  <StatusBadge status={l.status} />
                  <span className="text-slate-500">{l.orderDate} · Dr. {l.orderedBy}</span>
                </div>
                {l.resultNotes && <p className="mt-1 text-slate-700">{l.resultNotes}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Visits">
        {chart.visits.length === 0 ? (
          <p className="text-slate-500">No visits yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {chart.visits.map((v) => (
              <li key={v.appointmentId} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">{v.date}</span>
                  <StatusBadge status={v.status} />
                  <span className="text-slate-500">Dr. {v.doctorName} · {v.specialty}</span>
                </div>
                {v.visitReason && <p className="mt-1 text-slate-700">Reason for visit: {v.visitReason}</p>}
                {v.diagnoses.length > 0 && <p className="mt-1 text-slate-700">Diagnosis: {v.diagnoses.join(", ")}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </PortalPage>
  );
}
