import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { api, apiErrorMessage } from "../../api";
import { PageError, PortalPage } from "../../components/PortalPage";
import { printReport } from "../../utils/printReport";
import { Section, StatusText, TextButton } from "../../components/ProfileUI";
import { StatCard } from "../../components/StatCard";
import { VisitSummaryReport } from "../../components/VisitSummaryReport";
import type { VisitSummaryData } from "../../components/VisitSummaryReport";
import { useAuth } from "../../context/AuthContext";

interface MedicalRecords {
  visits: { appointmentId: number; visitDate: string; visitReason: string | null; diagnosis: string | null; notes: string | null }[];
  prescriptions: { prescriptionItemId: number; medicationName: string; dosage: string; instructions: string | null; isActive: boolean }[];
  labResults: { labOrderId: number; testName: string; orderDate: string; resultNotes: string | null }[];
}

export function PatientRecords() {
  const { user } = useAuth();
  const patientId = user?.role === "patient" ? user.id : null;
  const [records, setRecords] = useState<MedicalRecords | null>(null);
  const [printing, setPrinting] = useState<VisitSummaryData | null>(null);
  const [error, setError] = useState("");

  // load my records
  useEffect(() => {
    async function loadRecords() {
      if (!patientId) return;
      try {
        const res = await api.get<MedicalRecords>(`/api/patient/${patientId}/records`);
        setRecords(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    loadRecords();
  }, [patientId]);

  // load one visit's full record, show it as a report, then open the print window
  async function downloadVisit(appointmentId: number) {
    setError("");
    try {
      const res = await api.get<VisitSummaryData>(`/api/patient/${patientId}/visits/${appointmentId}`);
      flushSync(() => setPrinting(res.data));
      printReport(`Visit Summary ${res.data.date}`);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <PortalPage eyebrow="Patient Portal" title="My Medical Records" description="Your visit history, prescriptions and lab results.">
      <PageError message={error} />
      {!records && !error && <p className="text-slate-500">Loading medical records...</p>}

      {records && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard label="Visits" value={String(records.visits.length)} />
            <StatCard label="Prescriptions" value={String(records.prescriptions.length)} />
            <StatCard label="Lab Results" value={String(records.labResults.length)} />
          </div>

          <Section title="Visit History">
            {records.visits.length === 0 ? (
              <p className="text-slate-500">No visit records.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {records.visits.map((v) => (
                  <li key={v.appointmentId} className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-slate-900">{v.visitDate}</p>
                      <TextButton onClick={() => downloadVisit(v.appointmentId)}>Download PDF</TextButton>
                    </div>
                    {v.visitReason && <p className="mt-1 text-slate-700">Reason for visit: {v.visitReason}</p>}
                    {v.diagnosis && <p className="mt-1 text-slate-700">Diagnosis: {v.diagnosis}</p>}
                    {v.notes && <p className="mt-1 whitespace-pre-wrap text-slate-600">{v.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="My Prescriptions">
            {records.prescriptions.length === 0 ? (
              <p className="text-slate-500">No prescriptions.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {records.prescriptions.map((p) => (
                  <li key={p.prescriptionItemId} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span>
                      <span className="font-medium text-slate-900">{p.medicationName}</span> · {p.dosage}
                      {p.instructions && <span className="text-slate-600"> · {p.instructions}</span>}
                    </span>
                    <StatusText status={p.isActive ? "Active" : "Inactive"} />
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Lab Results">
            {records.labResults.length === 0 ? (
              <p className="text-slate-500">No lab results.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {records.labResults.map((l) => (
                  <li key={l.labOrderId} className="py-3">
                    <p>
                      <span className="font-medium text-slate-900">{l.testName}</span>
                      <span className="text-slate-500"> · ordered {l.orderDate}</span>
                    </p>
                    <p className="mt-1 text-slate-700">{l.resultNotes ?? "Waiting for the result"}</p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </>
      )}

      {printing && <VisitSummaryReport visit={printing} />}
    </PortalPage>
  );
}
