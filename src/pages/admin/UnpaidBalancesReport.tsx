import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { AdminPage } from "../../components/admin/AdminPage";
import { DotsButton } from "../../components/admin/DotsButton";
import { Modal } from "../../components/Modal";
import { ReportPeriod } from "../../components/admin/ReportPeriod";
import { SortableTable } from "../../components/admin/SortableTable";
import { Field, SelectField } from "../../components/FormControls";
import { PageError } from "../../components/PortalPage";
import { PrintReport, ReportSection, ReportTable } from "../../components/PrintReport";
import { NotAvailable, SecondaryButton, Section, StatusBadge } from "../../components/ProfileUI";
import { StatCard } from "../../components/StatCard";
import { formatId } from "../../utils/id";
import { printReport } from "../../utils/printReport";
import { periodRange } from "../../utils/reportPeriod";
import type { Period } from "../../utils/reportPeriod";

interface Options {
  offices: { officeId: number; name: string }[];
  doctors: { doctorId: number; name: string }[];
  specialties: { specialtyId: number; name: string }[];
  providers: string[];
}

interface PatientRow {
  patientId: number;
  patientName: string;
  phone: string;
  payer: string;
  insuranceStatus: string;
  invoices: number;
  balance: number;
  oldestDays: number;
  lastPayment: string | null;
}

interface UnpaidInvoice {
  invoiceId: number;
  patientId: number;
  issueDate: string;
  amount: number;
  paid: number;
  balance: number;
  daysUnpaid: number;
  status: string;
}

interface PaidInvoice {
  invoiceId: number;
  patientId: number;
  patientName: string;
  payer: string;
  issueDate: string;
  amount: number;
  paidOn: string | null;
}

interface Report {
  summary: { invoices: number; billed: number; collected: number; outstanding: number; collectionRate: number | null };
  aging: { bucket: string; invoices: number; amount: number }[];
  payers: { payer: string; patients: number; invoices: number; amount: number }[];
  patients: PatientRow[];
  unpaidInvoices: UnpaidInvoice[];
  paidInvoices: PaidInvoice[];
}

const BUCKETS = ["0-30", "31-60", "61-90", "90+"];
const money = (value: number) => `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// who owes the clinic, for how long, and which payer is behind
export function AdminUnpaidBalancesReport() {
  // the filters live in the URL, so a filtered report can be bookmarked or shared
  const [params, setParams] = useSearchParams();
  const period = (params.get("period") as Period) ?? "year";
  const from = params.get("from") ?? periodRange(period).from;
  const to = params.get("to") ?? periodRange(period).to;
  const officeId = params.get("officeId") ?? "";
  const doctorId = params.get("doctorId") ?? "";
  const specialtyId = params.get("specialtyId") ?? "";
  const patient = params.get("patient") ?? "";
  const payer = params.get("payer") ?? "";
  const insuranceStatus = params.get("insuranceStatus") ?? "";
  const invoiceStatus = params.get("invoiceStatus") ?? "";
  const daysUnpaid = params.get("daysUnpaid") ?? "";
  const minBalance = params.get("minBalance") ?? "";

  const [options, setOptions] = useState<Options | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [details, setDetails] = useState<PatientRow | null>(null);

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
        const res = await api.get<Report>("/api/admin/data-reports/unpaid-balances", {
          params: {
            from,
            to,
            officeId: officeId || undefined,
            doctorId: doctorId || undefined,
            specialtyId: specialtyId || undefined,
            patient: patient || undefined,
            payer: payer || undefined,
            insuranceStatus: insuranceStatus || undefined,
            invoiceStatus: invoiceStatus || undefined,
            daysUnpaid: daysUnpaid || undefined,
            minBalance: minBalance || undefined,
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
  }, [from, to, officeId, doctorId, specialtyId, patient, payer, insuranceStatus, invoiceStatus, daysUnpaid, minBalance]);

  const s = report?.summary;
  const bucketAmount = (bucket: string) => report?.aging.find((a) => a.bucket === bucket);
  const fileName = `Unpaid Balances ${from} to ${to}`;


  return (
    <AdminPage
      title="Unpaid Balances"
      description="Who owes the clinic money, how long it's been unpaid, and whether patients or insurance are behind."
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
        <SelectField label="Payer" value={payer} onChange={(e) => setFilters({ payer: e.target.value })}>
          <option value="">All payers</option>
          <option value="Self-pay">Self-pay</option>
          {options?.providers.map((p) => <option key={p} value={p}>{p}</option>)}
        </SelectField>
        <SelectField label="Insurance status" value={insuranceStatus} onChange={(e) => setFilters({ insuranceStatus: e.target.value })}>
          <option value="">Any</option>
          <option value="Verified">Verified</option>
          <option value="Pending">Pending</option>
          <option value="Denied">Denied</option>
          <option value="None">No insurance</option>
        </SelectField>
        <SelectField label="Invoice status" value={invoiceStatus} onChange={(e) => setFilters({ invoiceStatus: e.target.value })}>
          <option value="">Any unpaid</option>
          <option value="Pending">Pending</option>
          <option value="Overdue">Overdue</option>
          <option value="Partly Paid">Partly paid</option>
        </SelectField>
        <SelectField label="Days unpaid" value={daysUnpaid} onChange={(e) => setFilters({ daysUnpaid: e.target.value })}>
          <option value="">Any</option>
          {BUCKETS.map((b) => <option key={b} value={b}>{b} days</option>)}
        </SelectField>
        <Field label="Minimum balance ($)" inputMode="decimal" placeholder="0" value={minBalance} onChange={(e) => setFilters({ minBalance: e.target.value.replace(/[^\d.]/g, "") })} />
      </div>

      <PageError message={error} />
      {loading && !report && <p className="text-slate-500">Loading report...</p>}

      {report && s && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Billed" value={money(s.billed)} note={`${s.invoices} invoices`} />
            <StatCard label="Collected" value={money(s.collected)} />
            <StatCard label="Outstanding" value={money(s.outstanding)} />
            <StatCard label="Collection Rate" value={s.collectionRate == null ? "N/A" : `${s.collectionRate}%`} note="Collected out of billed" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Days Unpaid">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {BUCKETS.map((b) => (
                  <div key={b} className={`rounded-lg border p-3 ${b === "90+" ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"}`}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{b} days</p>
                    <p className="mt-1 text-lg font-bold text-navy">{money(bucketAmount(b)?.amount ?? 0)}</p>
                    <p className="text-xs text-slate-500">{bucketAmount(b)?.invoices ?? 0} invoices</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="By Payer">
              {report.payers.length === 0 ? (
                <p className="text-slate-500">Nothing owed for these filters.</p>
              ) : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {report.payers.map((p) => (
                    <li key={p.payer} className="flex justify-between gap-3 py-2">
                      <span className="font-medium text-slate-900">{p.payer}</span>
                      <span className="text-slate-600">
                        {p.patients} patients · {p.invoices} invoices · <span className="font-semibold text-navy">{money(p.amount)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          <Section title={`Patients With a Balance (${report.patients.length})`}>
            <SortableTable
              rows={report.patients}
              searchKeys={["patientName", "phone", "payer"]}
              searchPlaceholder="Search patient, phone, payer"
              empty="Nobody owes anything for these filters."
              pageSize={20}
              columns={[
                {
                  key: "patientName",
                  label: "Patient",
                  render: (p) => (
                    <>
                      <span className="block font-medium text-navy">{p.patientName}</span>
                      <span className="block text-xs text-slate-500">
                        <span className="font-mono">#{formatId(p.patientId)}</span> · {p.phone}
                      </span>
                    </>
                  ),
                },
                { key: "payer", label: "Payer" },
                { key: "insuranceStatus", label: "Insurance", render: (p) => (p.insuranceStatus === "None" ? <NotAvailable /> : <StatusBadge status={p.insuranceStatus} />) },
                { key: "invoices", label: "Invoices", right: true },
                { key: "balance", label: "Balance", right: true, render: (p) => <span className="font-semibold text-navy">{money(p.balance)}</span> },
                {
                  key: "oldestDays",
                  label: "Days Unpaid",
                  right: true,
                  render: (p) => <span className={p.oldestDays > 90 ? "font-semibold text-red-600" : ""}>{p.oldestDays}</span>,
                },
                { key: "lastPayment", label: "Last Payment", render: (p) => p.lastPayment ?? <NotAvailable /> },
                {
                  key: "patientId",
                  label: "Details",
                  right: true,
                  noSort: true,
                  render: (p) => <DotsButton label={`See unpaid invoices for ${p.patientName}`} onClick={() => setDetails(p)} />,
                },
              ]}
            />
          </Section>

          <Section title={`Paid Invoices (${report.paidInvoices.length})`}>
            <SortableTable
              rows={report.paidInvoices}
              searchKeys={["patientName", "payer"]}
              searchPlaceholder="Search patient, payer"
              empty="No invoices were paid in full for these filters."
              pageSize={20}
              columns={[
                { key: "invoiceId", label: "Invoice", render: (i) => <span className="font-mono text-slate-500">#{i.invoiceId}</span> },
                { key: "patientName", label: "Patient", render: (i) => <span className="font-medium text-navy">{i.patientName}</span> },
                { key: "payer", label: "Payer" },
                { key: "issueDate", label: "Issued" },
                { key: "amount", label: "Amount", right: true, render: (i) => money(i.amount) },
                { key: "paidOn", label: "Paid On", render: (i) => i.paidOn ?? <NotAvailable /> },
              ]}
            />
          </Section>

          {details && (
            <Modal title={`${details.patientName}: Unpaid Invoices`} onClose={() => setDetails(null)}>
              <p className="mb-4 text-sm text-slate-600">
                Patient #{formatId(details.patientId)} · {details.phone} · {details.payer} · Balance{" "}
                <span className="font-semibold text-navy">{money(details.balance)}</span>
              </p>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-3">Invoice</th>
                      <th className="px-3 py-3">Issued</th>
                      <th className="px-3 py-3 text-right">Amount</th>
                      <th className="px-3 py-3 text-right">Paid</th>
                      <th className="px-3 py-3 text-right">Balance</th>
                      <th className="px-3 py-3 text-right">Days</th>
                      <th className="px-3 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.unpaidInvoices
                      .filter((i) => i.patientId === details.patientId)
                      .map((i) => (
                        <tr key={i.invoiceId} className="hover:bg-slate-50">
                          <td className="px-3 py-3 font-mono text-slate-500">#{i.invoiceId}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-slate-700">{i.issueDate}</td>
                          <td className="px-3 py-3 text-right text-slate-700">{money(i.amount)}</td>
                          <td className="px-3 py-3 text-right text-slate-700">{money(i.paid)}</td>
                          <td className="px-3 py-3 text-right font-semibold text-navy">{money(i.balance)}</td>
                          <td className={`px-3 py-3 text-right ${i.daysUnpaid > 90 ? "font-semibold text-red-600" : "text-slate-700"}`}>{i.daysUnpaid}</td>
                          <td className="whitespace-nowrap px-3 py-3"><StatusBadge status={i.status} /></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Modal>
          )}

          <PrintReport title="Unpaid Balances Report" subtitle={`Invoices issued ${from} to ${to}`}>
            <ReportSection title="Summary">
              <ReportTable
                headers={["Invoices", "Billed", "Collected", "Outstanding", "Collection Rate"]}
                rows={[[s.invoices, money(s.billed), money(s.collected), money(s.outstanding), s.collectionRate == null ? "N/A" : `${s.collectionRate}%`]]}
                alignRight={[0, 1, 2, 3, 4]}
              />
            </ReportSection>
            <ReportSection title="Days Unpaid">
              <ReportTable
                headers={["Days Unpaid", "Invoices", "Amount"]}
                rows={BUCKETS.map((b) => [`${b} days`, bucketAmount(b)?.invoices ?? 0, money(bucketAmount(b)?.amount ?? 0)])}
                alignRight={[1, 2]}
              />
            </ReportSection>
            <ReportSection title="By Payer">
              <ReportTable headers={["Payer", "Patients", "Invoices", "Amount"]} rows={report.payers.map((p) => [p.payer, p.patients, p.invoices, money(p.amount)])} alignRight={[1, 2, 3]} />
            </ReportSection>
            <ReportSection title="Patients With a Balance">
              <ReportTable
                headers={["Patient", "Phone", "Payer", "Invoices", "Balance", "Days Unpaid", "Last Payment"]}
                rows={report.patients.map((p) => [p.patientName, p.phone, p.payer, p.invoices, money(p.balance), p.oldestDays, p.lastPayment ?? "N/A"])}
                alignRight={[3, 4, 5]}
              />
            </ReportSection>
            <ReportSection title="Paid Invoices">
              <ReportTable
                headers={["Invoice", "Patient", "Payer", "Issued", "Amount", "Paid On"]}
                rows={report.paidInvoices.map((i) => [`#${i.invoiceId}`, i.patientName, i.payer, i.issueDate, money(i.amount), i.paidOn ?? "N/A"])}
                alignRight={[4]}
              />
            </ReportSection>
          </PrintReport>
        </>
      )}
    </AdminPage>
  );
}
