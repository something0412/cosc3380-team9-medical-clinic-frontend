import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { AdminPage } from "../../components/admin/AdminPage";
import { ReportPeriod } from "../../components/admin/ReportPeriod";
import { SortableTable } from "../../components/admin/SortableTable";
import { Field, SelectField } from "../../components/FormControls";
import { PageError } from "../../components/PortalPage";
import { PrintReport, ReportSection, ReportTable } from "../../components/PrintReport";
import { SecondaryButton, Section, StatusBadge } from "../../components/ProfileUI";
import { StatCard } from "../../components/StatCard";
import { printReport } from "../../utils/printReport";
import { periodRange } from "../../utils/reportPeriod";
import type { Period } from "../../utils/reportPeriod";

interface Options {
  offices: { officeId: number; name: string }[];
  doctors: { doctorId: number; name: string }[];
  specialties: { specialtyId: number; name: string }[];
}

interface GroupRow {
  id: number;
  name: string;
  total: number;
  completed: number;
  noShows: number;
  cancelled: number;
  lateCancelled: number;
  noShowRate: number | null;
  cancelRate: number | null;
}

interface MissedRow {
  appointmentId: number;
  patientId: number;
  patientName: string;
  phone: string;
  date: string;
  time: string;
  doctorName: string;
  officeName: string;
  specialty: string;
  channel: string;
  outcome: string;
}

interface Report {
  summary: { total: number; completed: number; noShows: number; cancelled: number; lateCancelled: number; scheduled: number };
  groups: GroupRow[];
  missed: MissedRow[];
}

const GROUP_LABELS: Record<string, string> = { doctor: "Doctor", office: "Office", specialty: "Specialty" };
const OUTCOME_LABELS: Record<string, string> = { missed: "All missed", noshow: "No-shows", cancelled: "Cancellations", late: "Late cancellations" };
const percent = (value: number | null) => (value == null ? "N/A" : `${value}%`);

// which doctors, offices or specialties lose the most visits to no-shows and cancellations
export function AdminMissedAppointmentsReport() {
  // the filters live in the URL, so a filtered report can be bookmarked or shared
  const [params, setParams] = useSearchParams();
  const period = (params.get("period") as Period) ?? "month";
  const from = params.get("from") ?? periodRange(period).from;
  const to = params.get("to") ?? periodRange(period).to;
  const officeId = params.get("officeId") ?? "";
  const doctorId = params.get("doctorId") ?? "";
  const specialtyId = params.get("specialtyId") ?? "";
  const patient = params.get("patient") ?? "";
  const channel = params.get("channel") ?? "";
  const outcome = params.get("outcome") ?? "missed";
  const groupBy = params.get("groupBy") ?? "doctor";

  const [options, setOptions] = useState<Options | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // change filters and keep the others
  function setFilters(changes: Record<string, string>) {
    const next = new URLSearchParams(params);
    next.set("period", period);
    next.set("from", from);
    next.set("to", to);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    setParams(next, { replace: true });
  }

  // load the filter choices
  useEffect(() => {
    async function loadOptions() {
      try {
        const res = await api.get<Options>("/api/admin/data-reports/options");
        setOptions(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    loadOptions();
  }, []);

  // load the report for the filters
  useEffect(() => {
    let ignore = false;
    async function loadReport() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get<Report>("/api/admin/data-reports/missed-appointments", {
          params: {
            from,
            to,
            officeId: officeId || undefined,
            doctorId: doctorId || undefined,
            specialtyId: specialtyId || undefined,
            patient: patient || undefined,
            channel: channel || undefined,
            outcome,
            groupBy,
          },
        });
        if (!ignore) setReport(res.data);
      } catch (err) {
        if (!ignore) setError(apiErrorMessage(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadReport();
    return () => {
      ignore = true;
    };
  }, [from, to, officeId, doctorId, specialtyId, patient, channel, outcome, groupBy]);

  const s = report?.summary;
  const happened = s ? s.completed + s.noShows : 0;
  const noShowRate = s && happened ? Math.round((1000 * s.noShows) / happened) / 10 : null;
  const cancelRate = s && s.total ? Math.round((1000 * s.cancelled) / s.total) / 10 : null;
  const fileName = `Missed Appointments ${from} to ${to}`;
  const groupLabel = GROUP_LABELS[groupBy];


  return (
    <AdminPage
      title="Missed Appointments"
      description="Where are no-shows and cancellations coming from, and which patients should the clinic follow up with?"
      back={{ to: "/admin/reports", label: "Back to Reports" }}
      actions={
        <SecondaryButton disabled={!report || loading} onClick={() => printReport(fileName)}>Download PDF</SecondaryButton>
      }
    >
      <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportPeriod period={period} from={from} to={to} onChange={(p, f, t) => setFilters({ period: p, from: f, to: t })} />
        <SelectField label="Office" value={officeId} onChange={(e) => setFilters({ officeId: e.target.value })}>
          <option value="">All offices</option>
          {options?.offices.map((o) => <option key={o.officeId} value={o.officeId}>{o.name}</option>)}
        </SelectField>
        <SelectField label="Doctor" value={doctorId} onChange={(e) => setFilters({ doctorId: e.target.value })}>
          <option value="">All doctors</option>
          {options?.doctors.map((d) => <option key={d.doctorId} value={d.doctorId}>Dr. {d.name}</option>)}
        </SelectField>
        <SelectField label="Specialty" value={specialtyId} onChange={(e) => setFilters({ specialtyId: e.target.value })}>
          <option value="">All specialties</option>
          {options?.specialties.map((sp) => <option key={sp.specialtyId} value={sp.specialtyId}>{sp.name}</option>)}
        </SelectField>
        <Field label="Patient" placeholder="Name or patient ID" value={patient} onChange={(e) => setFilters({ patient: e.target.value })} />
        <SelectField label="Booked by" value={channel} onChange={(e) => setFilters({ channel: e.target.value })}>
          <option value="">Web and phone</option>
          <option value="Web">Web (patient)</option>
          <option value="Phone">Phone (front desk)</option>
        </SelectField>
        <SelectField label="Outcome" value={outcome} onChange={(e) => setFilters({ outcome: e.target.value })}>
          {Object.entries(OUTCOME_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </SelectField>
        <SelectField label="Group by" value={groupBy} onChange={(e) => setFilters({ groupBy: e.target.value })}>
          {Object.entries(GROUP_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </SelectField>
      </div>

      <PageError message={error} />
      {loading && !report && <p className="text-slate-500">Loading report...</p>}

      {report && s && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label="Appointments" value={String(s.total)} note={`${s.scheduled} still scheduled`} />
            <StatCard label="No-Show Rate" value={percent(noShowRate)} note={`${s.noShows} no-shows of ${happened} past visits`} />
            <StatCard label="Cancellation Rate" value={percent(cancelRate)} note={`${s.cancelled} cancelled`} />
            <StatCard label="Late Cancellations" value={String(s.lateCancelled)} note="Within 24 hours of the visit" />
            <StatCard label="Completed" value={String(s.completed)} />
          </div>

          <Section title={`By ${groupLabel}`}>
            <SortableTable
              rows={report.groups}
              searchKeys={["name"]}
              searchPlaceholder={`Search ${groupLabel.toLowerCase()}`}
              empty="No appointments match these filters."
              columns={[
                { key: "name", label: groupLabel, render: (g) => (groupBy === "doctor" ? `Dr. ${g.name}` : g.name) },
                { key: "total", label: "Appointments", right: true },
                { key: "completed", label: "Completed", right: true },
                { key: "noShows", label: "No-Shows", right: true },
                { key: "cancelled", label: "Cancelled", right: true },
                { key: "lateCancelled", label: "Late Cancel", right: true },
                { key: "noShowRate", label: "No-Show Rate", right: true, render: (g) => percent(g.noShowRate) },
                { key: "cancelRate", label: "Cancel Rate", right: true, render: (g) => percent(g.cancelRate) },
              ]}
            />
          </Section>

          <Section title={`${OUTCOME_LABELS[outcome]} (${report.missed.length})`}>
            <SortableTable
              rows={report.missed}
              searchKeys={["patientName", "phone", "doctorName", "officeName", "specialty"]}
              searchPlaceholder="Search patient, phone, doctor"
              empty="No missed appointments for these filters."
              columns={[
                { key: "date", label: "Date" },
                { key: "time", label: "Time" },
                { key: "patientName", label: "Patient", render: (m) => <span className="font-medium text-navy">{m.patientName}</span> },
                { key: "phone", label: "Phone" },
                { key: "doctorName", label: "Doctor", render: (m) => `Dr. ${m.doctorName}` },
                { key: "officeName", label: "Office" },
                { key: "specialty", label: "Specialty" },
                { key: "channel", label: "Booked By" },
                { key: "outcome", label: "Outcome", render: (m) => <StatusBadge status={m.outcome} /> },
              ]}
            />
          </Section>

          <PrintReport title="Missed Appointments Report" subtitle={`${from} to ${to}`}>
            <ReportSection title="Summary">
              <ReportTable
                headers={["Appointments", "Completed", "No-Shows", "No-Show Rate", "Cancelled", "Cancel Rate", "Late Cancellations"]}
                rows={[[s.total, s.completed, s.noShows, percent(noShowRate), s.cancelled, percent(cancelRate), s.lateCancelled]]}
                alignRight={[0, 1, 2, 3, 4, 5, 6]}
              />
            </ReportSection>
            <ReportSection title={`By ${groupLabel}`}>
              <ReportTable
                headers={[groupLabel, "Appointments", "No-Shows", "No-Show Rate", "Cancelled", "Cancel Rate"]}
                rows={report.groups.map((g) => [g.name, g.total, g.noShows, percent(g.noShowRate), g.cancelled, percent(g.cancelRate)])}
                alignRight={[1, 2, 3, 4, 5]}
              />
            </ReportSection>
            <ReportSection title={OUTCOME_LABELS[outcome]}>
              <ReportTable
                headers={["Date", "Patient", "Phone", "Doctor", "Office", "Outcome"]}
                rows={report.missed.map((m) => [m.date, m.patientName, m.phone, `Dr. ${m.doctorName}`, m.officeName, m.outcome])}
              />
            </ReportSection>
          </PrintReport>
        </>
      )}
    </AdminPage>
  );
}
