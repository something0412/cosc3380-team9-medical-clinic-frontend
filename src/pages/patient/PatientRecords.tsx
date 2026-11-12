import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { flushSync } from "react-dom";
import { api, apiErrorMessage } from "../../api";
import { Modal } from "../../components/Modal";
import { PageError, PortalPage } from "../../components/PortalPage";
import { printReport } from "../../utils/printReport";
import { NotAvailable, SecondaryButton, Section, StatusBadge, StatusText, TextButton } from "../../components/ProfileUI";
import { StatCard } from "../../components/StatCard";
import { VisitSummaryReport } from "../../components/VisitSummaryReport";
import type { VisitSummaryData } from "../../components/VisitSummaryReport";
import { useAuth } from "../../context/AuthContext";

interface MedicalRecords {
  visits: { appointmentId: number; visitDate: string; startTime: string; doctorName: string; specialty: string; officeName: string }[];
  prescriptions: { prescriptionItemId: number; medicationName: string; dosage: string; instructions: string | null; isActive: boolean; visitDate: string | null }[];
  labResults: { labOrderId: number; testName: string; orderDate: string; status: string; resultNotes: string | null; visitDate: string | null }[];
}

// 14:30 -> 2:30 PM
function showTime(value: string) {
  const [hour, minute = "00"] = value.split(":");
  const h = Number(hour);
  return `${h % 12 || 12}:${minute} ${h >= 12 ? "PM" : "AM"}`;
}

// InProgress -> In Progress
const labStatus = (status: string) => (status === "InProgress" ? "In Progress" : status);

// one heading and its content inside the visit summary
function SummaryPart({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </div>
  );
}

// one vital reading in the visit summary
function Reading({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-900">{value}</p>
    </div>
  );
}

export function PatientRecords() {
  const { user } = useAuth();
  const patientId = user?.role === "patient" ? user.id : null;
  const [records, setRecords] = useState<MedicalRecords | null>(null);
  const [viewing, setViewing] = useState<VisitSummaryData | null>(null);
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

  // show one visit as a report, then open the print window
  function printVisit(visit: VisitSummaryData) {
    flushSync(() => setPrinting(visit));
    printReport(`Visit Summary ${visit.date}`);
  }

  // load one visit's full record for the summary pop-up
  async function viewVisit(appointmentId: number) {
    setError("");
    try {
      const res = await api.get<VisitSummaryData>(`/api/patient/${patientId}/visits/${appointmentId}`);
      setViewing(res.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  // load one visit's full record and print it
  async function downloadVisit(appointmentId: number) {
    setError("");
    try {
      const res = await api.get<VisitSummaryData>(`/api/patient/${patientId}/visits/${appointmentId}`);
      printVisit(res.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  const vitals = viewing?.vitals[0];

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
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Doctor</th>
                      <th className="px-4 py-3">Specialty</th>
                      <th className="px-4 py-3">Office</th>
                      <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.visits.map((v) => (
                      <tr key={v.appointmentId} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-3 text-slate-700">{v.visitDate}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-700">{showTime(v.startTime)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-700">Dr. {v.doctorName}</td>
                        <td className="px-4 py-3 text-slate-700">{v.specialty}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-700">{v.officeName}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <TextButton onClick={() => viewVisit(v.appointmentId)}>View</TextButton>
                          <TextButton className="ml-4" onClick={() => downloadVisit(v.appointmentId)}>Download PDF</TextButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title="My Prescriptions">
            {records.prescriptions.length === 0 ? (
              <p className="text-slate-500">No prescriptions.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Medication</th>
                      <th className="px-4 py-3">Dosage</th>
                      <th className="px-4 py-3">Instructions</th>
                      <th className="px-4 py-3">From Visit</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.prescriptions.map((p) => (
                      <tr key={p.prescriptionItemId} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{p.medicationName}</td>
                        <td className="px-4 py-3 text-slate-700">{p.dosage}</td>
                        <td className="px-4 py-3 text-slate-700">{p.instructions ?? <NotAvailable />}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-700">{p.visitDate ?? <NotAvailable />}</td>
                        <td className="px-4 py-3"><StatusBadge status={p.isActive ? "Active" : "Inactive"} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title="Lab Results">
            {records.labResults.length === 0 ? (
              <p className="text-slate-500">No lab results.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Test</th>
                      <th className="px-4 py-3">Ordered</th>
                      <th className="px-4 py-3">From Visit</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.labResults.map((l) => (
                      <tr key={l.labOrderId} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{l.testName}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-700">{l.orderDate}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-700">{l.visitDate ?? <NotAvailable />}</td>
                        <td className="px-4 py-3"><StatusBadge status={labStatus(l.status)} /></td>
                        <td className="px-4 py-3 text-slate-700">{l.resultNotes ?? <span className="text-slate-500">Waiting for the result</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </>
      )}

      {viewing && (
        <Modal title="After Visit Summary" onClose={() => setViewing(null)}>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div><dt className="text-slate-500">Date</dt><dd className="font-medium text-slate-900">{viewing.date} at {showTime(viewing.startTime)}</dd></div>
            <div><dt className="text-slate-500">Doctor</dt><dd className="font-medium text-slate-900">Dr. {viewing.doctorName}</dd></div>
            <div><dt className="text-slate-500">Specialty</dt><dd className="font-medium text-slate-900">{viewing.specialty}</dd></div>
            <div><dt className="text-slate-500">Office</dt><dd className="font-medium text-slate-900">{viewing.officeName}</dd></div>
          </dl>

          <SummaryPart title="Why You Came In">
            <p className="text-sm text-slate-800">{viewing.summary?.visitReason ?? <NotAvailable />}</p>
          </SummaryPart>

          <SummaryPart title="What We Found">
            <p className="mb-1 text-sm font-semibold text-slate-900">Lab Results</p>
            {!viewing.labOrders || viewing.labOrders.length === 0 ? (
              <p className="text-sm text-slate-500">No lab tests at this visit.</p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 px-3 text-sm">
                {viewing.labOrders.map((l) => (
                  <li key={l.labOrderId} className="py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-slate-900">{l.testName}</span>
                      <StatusText status={labStatus(l.status)} />
                    </div>
                    <p className="text-slate-600">
                      {l.resultNotes ?? "Waiting for the result"}
                      {l.resultDate && <span className="text-slate-500"> · {l.resultDate}</span>}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <p className="mb-1 mt-4 text-sm font-semibold text-slate-900">Diagnoses</p>
            {viewing.diagnoses.length === 0 ? (
              <p className="text-sm text-slate-500">No diagnoses recorded.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {viewing.diagnoses.map((d) => (
                  <li key={d.visitDiagnosisId}>
                    <p className="font-medium text-slate-900">{d.name}</p>
                    {d.reasoning && <p className="text-slate-600">{d.reasoning}</p>}
                  </li>
                ))}
              </ul>
            )}
          </SummaryPart>

          <SummaryPart title="Your Vitals">
            {!vitals ? (
              <p className="text-sm text-slate-500">No vitals recorded.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <Reading label="Temperature" value={vitals.temperature != null ? `${vitals.temperature} °F` : <NotAvailable />} />
                <Reading label="Heart Rate" value={vitals.heartRate != null ? `${vitals.heartRate} bpm` : <NotAvailable />} />
                <Reading label="Blood Pressure" value={vitals.systolic != null && vitals.diastolic != null ? `${vitals.systolic}/${vitals.diastolic}` : <NotAvailable />} />
                <Reading label="Breathing" value={vitals.respiratoryRate != null ? `${vitals.respiratoryRate}/min` : <NotAvailable />} />
                <Reading label="Oxygen" value={vitals.oxygenSaturation != null ? `${vitals.oxygenSaturation}%` : <NotAvailable />} />
                <Reading label="Weight" value={vitals.weight != null ? `${vitals.weight} lb` : <NotAvailable />} />
                <Reading label="Height" value={vitals.height != null ? `${vitals.height} in` : <NotAvailable />} />
              </div>
            )}
          </SummaryPart>

          <SummaryPart title="Medications Prescribed">
            {viewing.prescriptions.length === 0 ? (
              <p className="text-sm text-slate-500">No medications prescribed at this visit.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {viewing.prescriptions.map((p) => (
                  <li key={p.prescriptionItemId} className="flex flex-wrap items-start justify-between gap-2 py-2">
                    <span>
                      <span className="font-medium text-slate-900">{p.medicationName}</span> · {p.dosage}
                      {p.durationDays != null && <span className="text-slate-600"> · {p.durationDays} days</span>}
                      {p.instructions && <span className="block text-slate-600">{p.instructions}</span>}
                    </span>
                    <StatusText status={p.isActive ? "Active" : "Inactive"} />
                  </li>
                ))}
              </ul>
            )}
          </SummaryPart>

          <SummaryPart title="Doctor's Notes">
            {viewing.summary?.notes ? (
              <p className="whitespace-pre-wrap text-sm text-slate-800">{viewing.summary.notes}</p>
            ) : (
              <p className="text-sm text-slate-500">{viewing.summary ? "No notes." : "No summary was written for this visit."}</p>
            )}
          </SummaryPart>

          <div className="mt-6 flex justify-end gap-2">
            <SecondaryButton onClick={() => printVisit(viewing)}>Download PDF</SecondaryButton>
            <SecondaryButton onClick={() => setViewing(null)}>Close</SecondaryButton>
          </div>
        </Modal>
      )}

      {printing && <VisitSummaryReport visit={printing} />}
    </PortalPage>
  );
}
