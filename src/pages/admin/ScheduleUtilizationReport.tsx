import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { AdminPage } from "../../components/admin/AdminPage";
import { DotsButton } from "../../components/admin/DotsButton";
import { ReportPeriod } from "../../components/admin/ReportPeriod";
import { SortableTable } from "../../components/admin/SortableTable";
import { SelectField } from "../../components/FormControls";
import { PageError } from "../../components/PortalPage";
import { PrintReport, ReportSection, ReportTable } from "../../components/PrintReport";
import { SecondaryButton, Section } from "../../components/ProfileUI";
import { StatCard } from "../../components/StatCard";
import { printReport } from "../../utils/printReport";
import { periodRange } from "../../utils/reportPeriod";
import type { Period } from "../../utils/reportPeriod";

interface Options {
  offices: { officeId: number; name: string }[];
  doctors: { doctorId: number; name: string }[];
  specialties: { specialtyId: number; name: string }[];
  shifts: { shiftTypeId: number; name: string }[];
}

interface Counts {
  offered: number;
  booked: number;
  open: number;
  completed: number;
  noShows: number;
  utilization: number | null;
}

interface DoctorRow extends Counts {
  doctorId: number;
  doctorName: string;
  offices: string;
  specialties: string;
}

interface DayRow extends Counts {
  dayOfWeek: string;
}

interface Report {
  summary: Counts;
  doctors: DoctorRow[];
  days: DayRow[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const UTILIZATION_RANGES: Record<string, { label: string; min: number; max: number }> = {
  low: { label: "Under 50% (mostly empty)", min: 0, max: 49.999 },
  mid: { label: "50% to 90%", min: 50, max: 90 },
  high: { label: "Over 90% (nearly full)", min: 90.001, max: 100 },
};
const percent = (value: number | null) => (value == null ? "N/A" : `${value}%`);

// a bar showing how full a schedule is
function UtilizationBar({ value }: { value: number | null }) {
  const width = Math.min(value ?? 0, 100);
  const color = width >= 90 ? "bg-red-500" : width >= 50 ? "bg-teal-600" : "bg-slate-400";
  return (
    <span className="inline-flex items-center justify-end gap-2">
      <span className="h-2 w-14 overflow-hidden rounded bg-slate-100">
        <span className={`block h-2 ${color}`} style={{ width: `${width}%` }} />
      </span>
      <span className="w-12 text-right">{percent(value)}</span>
    </span>
  );
}

// how full each doctor's schedule is compared to the slots it offers
export function AdminScheduleUtilizationReport() {
  // the filters live in the URL, so a filtered report can be bookmarked or shared
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const period = (params.get("period") as Period) ?? "month";
  const from = params.get("from") ?? periodRange(period).from;
  const to = params.get("to") ?? periodRange(period).to;
  const officeId = params.get("officeId") ?? "";
  const doctorId = params.get("doctorId") ?? "";
  const specialtyId = params.get("specialtyId") ?? "";
  const dayOfWeek = params.get("dayOfWeek") ?? "";
  const shiftTypeId = params.get("shiftTypeId") ?? "";
  const utilization = params.get("utilization") ?? "";

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
      const range = UTILIZATION_RANGES[utilization];
      try {
        const res = await api.get<Report>("/api/admin/data-reports/schedule-utilization", {
          params: {
            from,
            to,
            officeId: officeId || undefined,
            doctorId: doctorId || undefined,
            specialtyId: specialtyId || undefined,
            dayOfWeek: dayOfWeek || undefined,
            shiftTypeId: shiftTypeId || undefined,
            minUtilization: range?.min,
            maxUtilization: range?.max,
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
  }, [from, to, officeId, doctorId, specialtyId, dayOfWeek, shiftTypeId, utilization]);

  const s = report?.summary;
  const fileName = `Schedule Utilization ${from} to ${to}`;

  // the calendar page gets the same filters, so its numbers match the doctor's row
  const calendarParams = new URLSearchParams(params);
  calendarParams.set("period", period);
  calendarParams.set("from", from);
  calendarParams.set("to", to);


  return (
    <AdminPage
      title="Schedule Utilization"
      description="How full is each doctor's schedule compared to the time slots they offer? Use it to add shifts where doctors are full and cut ones that stay empty."
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
        <SelectField label="Day of week" value={dayOfWeek} onChange={(e) => setFilters({ dayOfWeek: e.target.value })}>
          <option value="">Every day</option>
          {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
        </SelectField>
        <SelectField label="Shift" value={shiftTypeId} onChange={(e) => setFilters({ shiftTypeId: e.target.value })}>
          <option value="">All shifts</option>
          {options?.shifts.map((sh) => <option key={sh.shiftTypeId} value={sh.shiftTypeId}>{sh.name}</option>)}
        </SelectField>
        <SelectField label="Utilization" value={utilization} onChange={(e) => setFilters({ utilization: e.target.value })}>
          <option value="">Any</option>
          {Object.entries(UTILIZATION_RANGES).map(([value, r]) => <option key={value} value={value}>{r.label}</option>)}
        </SelectField>
      </div>

      <PageError message={error} />
      {loading && !report && <p className="text-slate-500">Loading report...</p>}

      {report && s && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Slots Offered" value={String(s.offered)} note="From the doctors' schedules" />
            <StatCard label="Booked" value={String(s.booked)} note={`${s.completed} completed · ${s.noShows} no-shows`} />
            <StatCard label="Open" value={String(s.open)} />
            <StatCard label="Utilization" value={percent(s.utilization)} note="Booked out of offered" />
          </div>

          <Section title="By Doctor">
            <SortableTable
              rows={report.doctors}
              searchKeys={["doctorName", "offices", "specialties"]}
              searchPlaceholder="Search doctor, office, specialty"
              empty="No scheduled slots for these filters."
              columns={[
                {
                  key: "doctorName",
                  label: "Doctor",
                  render: (d) => (
                    <>
                      <span className="block font-medium text-navy">Dr. {d.doctorName}</span>
                      <span className="block whitespace-normal text-xs text-slate-500">
                        {d.specialties} · {d.offices}
                      </span>
                    </>
                  ),
                },
                { key: "offered", label: "Offered", right: true },
                { key: "booked", label: "Booked", right: true },
                { key: "open", label: "Open", right: true },
                { key: "noShows", label: "No-Shows", right: true },
                { key: "utilization", label: "Utilization", right: true, render: (d) => <UtilizationBar value={d.utilization} /> },
                {
                  key: "doctorId",
                  label: "Calendar",
                  right: true,
                  noSort: true,
                  render: (d) => (
                    <DotsButton
                      label={`See Dr. ${d.doctorName}'s schedule calendar`}
                      onClick={() => navigate(`/admin/reports/schedule-utilization/doctors/${d.doctorId}?${calendarParams.toString()}`)}
                    />
                  ),
                },
              ]}
            />
          </Section>

          <Section
            title="By Day of the Week"
            action={
              <SecondaryButton onClick={() => navigate(`/admin/reports/schedule-utilization/calendar?${calendarParams.toString()}`)}>
                View Calendar
              </SecondaryButton>
            }
          >
            <SortableTable
              rows={report.days}
              searchKeys={["dayOfWeek"]}
              searchPlaceholder="Search day"
              empty="No scheduled slots for these filters."
              columns={[
                { key: "dayOfWeek", label: "Day" },
                { key: "offered", label: "Offered", right: true },
                { key: "booked", label: "Booked", right: true },
                { key: "open", label: "Open", right: true },
                { key: "noShows", label: "No-Shows", right: true },
                { key: "utilization", label: "Utilization", right: true, render: (d) => <UtilizationBar value={d.utilization} /> },
              ]}
            />
          </Section>

          <PrintReport title="Schedule Utilization Report" subtitle={`${from} to ${to}`}>
            <ReportSection title="Summary">
              <ReportTable
                headers={["Slots Offered", "Booked", "Open", "Completed", "No-Shows", "Utilization"]}
                rows={[[s.offered, s.booked, s.open, s.completed, s.noShows, percent(s.utilization)]]}
                alignRight={[0, 1, 2, 3, 4, 5]}
              />
            </ReportSection>
            <ReportSection title="By Doctor">
              <ReportTable
                headers={["Doctor", "Offices", "Offered", "Booked", "Open", "Utilization"]}
                rows={report.doctors.map((d) => [`Dr. ${d.doctorName}`, d.offices, d.offered, d.booked, d.open, percent(d.utilization)])}
                alignRight={[2, 3, 4, 5]}
              />
            </ReportSection>
            <ReportSection title="By Day of the Week">
              <ReportTable
                headers={["Day", "Offered", "Booked", "Open", "Utilization"]}
                rows={report.days.map((d) => [d.dayOfWeek, d.offered, d.booked, d.open, percent(d.utilization)])}
                alignRight={[1, 2, 3, 4]}
              />
            </ReportSection>
          </PrintReport>
        </>
      )}
    </AdminPage>
  );
}
