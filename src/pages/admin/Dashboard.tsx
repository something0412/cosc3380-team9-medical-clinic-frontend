import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "../../api";
import { AdminPage } from "../../components/admin/AdminPage";
import { PageError } from "../../components/PortalPage";
import { BarChart } from "../../components/BarChart";
import { PrintReport, ReportSection, ReportTable } from "../../components/PrintReport";
import { SecondaryButton, Section, StatusBadge } from "../../components/ProfileUI";
import { StatCard } from "../../components/StatCard";
import { CHART_COLORS } from "../../utils/chartColors";
import { printReport } from "../../utils/printReport";

interface DashboardData {
    activePatients: number;
    upcomingVisits: number;
    collected: number;
    pending: number;
    year: number;
    signupsByMonth: { month: number; signups: number }[];
}

interface AppointmentData {
    total: number;
    pastTotal: number;
    completed: number;
    scheduled: number;
    cancelled: number;
    noShows: number;
    phoneBookings: number;
    webBookings: number;
    byStatus: { status: string; count: number }[];
    bySpecialty: {
        specialty: string;
        completed: number;
        scheduled: number;
        cancelled: number;
        noShows: number;
        total: number;
    }[];
}

interface BillingData {
    billed: number;
    collected: number;
    outstanding: number;
    overdue: number;
    invoiceCount: number;
    paidCount: number;
    pendingCount: number;
    overdueCount: number;
    year: number;
    byMonth: { month: number; billed: number; collected: number }[];
    byPaymentType: { paymentType: string; payments: number; amount: number }[];
    unpaidInvoices: {
        invoiceId: number;
        patientName: string;
        issueDate: string;
        amount: number;
        balance: number;
        status: string;
    }[];
}

type Tab = "appointments" | "billing";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const THIS_YEAR = new Date().getFullYear();
const YEARS = [THIS_YEAR, THIS_YEAR - 1, THIS_YEAR - 2];

const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });
const percent = (part: number, whole: number) => (whole ? `${((part / whole) * 100).toFixed(1)}%` : "0%");

export function AdminDashboard() {
    const [year, setYear] = useState(THIS_YEAR);
    const [tab, setTab] = useState<Tab>("appointments");
    const [overview, setOverview] = useState<DashboardData | null>(null);
    const [appointments, setAppointments] = useState<AppointmentData | null>(null);
    const [billing, setBilling] = useState<BillingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // load the overview, appointment activity and billing for the year
    useEffect(() => {
        let active = true;

        async function loadDashboard() {
            setLoading(true);
            setError("");
            try {
                const overviewRes = await api.get<DashboardData>("/api/admin/dashboard", { params: { year } });
                const appointmentsRes = await api.get<AppointmentData>("/api/admin/analytics/appointments", { params: { year } });
                const billingRes = await api.get<BillingData>("/api/admin/analytics/billing", { params: { year } });
                if (active) {
                    setOverview(overviewRes.data);
                    setAppointments(appointmentsRes.data);
                    setBilling(billingRes.data);
                }
            } catch (err) {
                if (active) setError(apiErrorMessage(err));
            } finally {
                if (active) setLoading(false);
            }
        }

        loadDashboard();
        return () => {
            active = false;
        };
    }, [year]);

    const ready = overview && appointments && billing;
    const totalSignups = overview?.signupsByMonth.reduce((sum, m) => sum + m.signups, 0) ?? 0;

    return (
        <AdminPage
            title="Dashboard"
            description="Clinic activity, appointments and billing for the year."
            actions={
                <>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        aria-label="Year"
                    >
                        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <SecondaryButton disabled={!ready || loading} onClick={() => printReport(`Clinic Activity Report ${year}`)}>
                        Download Report
                    </SecondaryButton>
                </>
            }
        >
            {loading && !ready && <p className="text-slate-500">Loading dashboard...</p>}
            <PageError message={error} />

            {ready && (
                <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard label="Active Patients" value={overview.activePatients.toLocaleString()} />
                        <StatCard label="Upcoming Visits" value={overview.upcomingVisits.toLocaleString()} note="Scheduled from now on" />
                        <StatCard label="Collected" value={money(overview.collected)} note="All payments received" />
                        <StatCard label="Pending" value={money(overview.pending)} note="Unpaid invoice balances" />
                    </div>

                    <Section title={`Patient Sign-ups in ${overview.year}`}>
                        <p className="mb-4 text-sm text-slate-500">{totalSignups} new patient accounts this year</p>
                        <BarChart
                            labels={MONTHS}
                            series={[{ name: "Sign-ups", values: overview.signupsByMonth.map((m) => m.signups) }]}
                        />
                    </Section>

                    <div className="flex gap-6 border-b border-slate-200">
                        {([["appointments", "Appointment Activity"], ["billing", "Billing & Collections"]] as [Tab, string][]).map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setTab(key)}
                                className={`-mb-px border-b-2 pb-3 text-sm font-medium ${
                                    tab === key ? "border-navy text-navy" : "border-transparent text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {tab === "appointments" ? <AppointmentActivity data={appointments} /> : <BillingCollections data={billing} />}

                    <ClinicReport overview={overview} appointments={appointments} billing={billing} />
                </>
            )}
        </AdminPage>
    );
}

function AppointmentActivity({ data }: { data: AppointmentData }) {
    const channels = [
        { name: "Phone (receptionist)", count: data.phoneBookings },
        { name: "Web (patient portal)", count: data.webBookings },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard label="Total Appointments" value={data.total.toLocaleString()} note={`${data.scheduled} still scheduled`} />
                <StatCard
                    label="Completion Rate"
                    value={percent(data.completed, data.pastTotal)}
                    note={`${data.completed} of ${data.pastTotal} past appointments`}
                />
                <StatCard
                    label="No-show Rate"
                    value={percent(data.noShows, data.pastTotal)}
                    note={`${data.noShows} of ${data.pastTotal} past appointments`}
                />
            </div>

            <Section title="Booking Channel">
                <div className="flex h-4 overflow-hidden rounded-full bg-slate-100">
                    {channels.map((c, i) => (
                        <div
                            key={c.name}
                            style={{ width: percent(c.count, data.total), backgroundColor: CHART_COLORS[i] }}
                            className={i > 0 ? "border-l-2 border-white" : ""}
                            title={`${c.name}: ${c.count} (${percent(c.count, data.total)})`}
                        />
                    ))}
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {channels.map((c, i) => (
                        <div key={c.name} className="flex items-start gap-3">
                            <span className="mt-1.5 h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: CHART_COLORS[i] }} />
                            <div>
                                <p className="text-sm text-slate-500">{c.name}</p>
                                <p className="text-2xl font-bold text-slate-900">{percent(c.count, data.total)}</p>
                                <p className="text-xs text-slate-400">{c.count} appointments</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            <Section title="Appointments by Status">
                <BarChart
                    labels={data.byStatus.map((s) => s.status)}
                    series={[{ name: "Appointments", values: data.byStatus.map((s) => s.count) }]}
                    showValues
                />
            </Section>

            <Section title="Visits by Specialty">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b text-slate-500">
                                <th className="p-2 font-medium">Specialty</th>
                                <th className="p-2 text-right font-medium">Completed Visits</th>
                                <th className="p-2 text-right font-medium">Scheduled</th>
                                <th className="p-2 text-right font-medium">Cancelled</th>
                                <th className="p-2 text-right font-medium">No Show</th>
                                <th className="p-2 text-right font-medium">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.bySpecialty.map((s) => (
                                <tr key={s.specialty} className="border-b">
                                    <td className="p-2 font-medium text-slate-900">{s.specialty}</td>
                                    <td className="p-2 text-right">{s.completed}</td>
                                    <td className="p-2 text-right">{s.scheduled}</td>
                                    <td className="p-2 text-right">{s.cancelled}</td>
                                    <td className="p-2 text-right">{s.noShows}</td>
                                    <td className="p-2 text-right font-medium">{s.total}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="font-semibold text-slate-900">
                                <td className="p-2">Total</td>
                                <td className="p-2 text-right">{data.completed}</td>
                                <td className="p-2 text-right">{data.scheduled}</td>
                                <td className="p-2 text-right">{data.cancelled}</td>
                                <td className="p-2 text-right">{data.noShows}</td>
                                <td className="p-2 text-right">{data.total}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </Section>
        </div>
    );
}

function BillingCollections({ data }: { data: BillingData }) {
    const maxTypeAmount = Math.max(1, ...data.byPaymentType.map((t) => t.amount));

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Billed" value={money(data.billed)} note={`${data.invoiceCount} invoices`} />
                <StatCard label="Collected" value={money(data.collected)} note={`${percent(data.collected, data.billed)} of billed`} />
                <StatCard label="Outstanding" value={money(data.outstanding)} note={`${data.pendingCount + data.overdueCount} unpaid invoices`} />
                <StatCard label="Overdue" value={money(data.overdue)} note={`${data.overdueCount} overdue invoices`} />
            </div>

            <Section title={`Billed vs Collected in ${data.year}`}>
                <BarChart
                    labels={MONTHS}
                    series={[
                        { name: "Billed", values: data.byMonth.map((m) => m.billed) },
                        { name: "Collected", values: data.byMonth.map((m) => m.collected) },
                    ]}
                    formatValue={(v) => `$${v.toLocaleString()}`}
                />
            </Section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Section title="Collections by Payment Type">
                    <ul className="space-y-4">
                        {data.byPaymentType.map((t) => (
                            <li key={t.paymentType}>
                                <div className="mb-1 flex justify-between text-sm">
                                    <span className="text-slate-700">{t.paymentType}</span>
                                    <span className="font-medium text-slate-900">
                                        {money(t.amount)} <span className="font-normal text-slate-400">· {t.payments} payments</span>
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-slate-100">
                                    <div className="h-2 rounded-full" style={{ width: `${(t.amount / maxTypeAmount) * 100}%`, backgroundColor: CHART_COLORS[0] }} />
                                </div>
                            </li>
                        ))}
                    </ul>
                </Section>

                <Section title="Invoices by Status">
                    <ul className="space-y-3">
                        {[
                            ["Paid", data.paidCount],
                            ["Pending", data.pendingCount],
                            ["Overdue", data.overdueCount],
                        ].map(([status, count]) => (
                            <li key={status} className="flex items-center justify-between">
                                <StatusBadge status={String(status)} />
                                <span className="text-sm text-slate-700">
                                    <span className="font-medium text-slate-900">{count}</span> ({percent(Number(count), data.invoiceCount)})
                                </span>
                            </li>
                        ))}
                    </ul>
                </Section>
            </div>

            <Section title="Unpaid Invoices">
                {data.unpaidInvoices.length === 0 ? (
                    <p className="text-slate-500">No unpaid invoices.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b text-slate-500">
                                    <th className="p-2 font-medium">Invoice</th>
                                    <th className="p-2 font-medium">Patient</th>
                                    <th className="p-2 font-medium">Issued</th>
                                    <th className="p-2 text-right font-medium">Amount</th>
                                    <th className="p-2 text-right font-medium">Balance</th>
                                    <th className="p-2 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.unpaidInvoices.map((i) => (
                                    <tr key={i.invoiceId} className="border-b">
                                        <td className="p-2">#{i.invoiceId}</td>
                                        <td className="p-2 font-medium text-slate-900">{i.patientName}</td>
                                        <td className="p-2">{i.issueDate}</td>
                                        <td className="p-2 text-right">{money(i.amount)}</td>
                                        <td className="p-2 text-right font-medium">{money(i.balance)}</td>
                                        <td className="p-2"><StatusBadge status={i.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Section>
        </div>
    );
}

// the printable clinic activity report for the year, month by month
function ClinicReport({ overview, appointments, billing }: { overview: DashboardData; appointments: AppointmentData; billing: BillingData }) {
    const totalSignups = overview.signupsByMonth.reduce((sum, m) => sum + m.signups, 0);

    return (
        <PrintReport title={`Clinic Activity Report ${overview.year}`} subtitle="Appointments, billing and patient sign-ups by month">
            <ReportSection title="Clinic Right Now">
                <ReportTable
                    headers={["Active Patients", "Upcoming Visits", "Collected (all time)", "Unpaid Balances"]}
                    rows={[[overview.activePatients, overview.upcomingVisits, money(overview.collected), money(overview.pending)]]}
                />
            </ReportSection>

            <ReportSection title={`Month by Month in ${overview.year}`}>
                <ReportTable
                    headers={["Month", "Patient Sign-ups", "Billed", "Collected"]}
                    alignRight={[1, 2, 3]}
                    rows={[
                        ...MONTHS.map((month, i) => [
                            month,
                            overview.signupsByMonth[i]?.signups ?? 0,
                            money(billing.byMonth[i]?.billed ?? 0),
                            money(billing.byMonth[i]?.collected ?? 0),
                        ]),
                        [
                            <span className="font-semibold">Total</span>,
                            <span className="font-semibold">{totalSignups}</span>,
                            <span className="font-semibold">{money(billing.byMonth.reduce((sum, m) => sum + m.billed, 0))}</span>,
                            <span className="font-semibold">{money(billing.byMonth.reduce((sum, m) => sum + m.collected, 0))}</span>,
                        ],
                    ]}
                />
            </ReportSection>

            <ReportSection title="Appointments">
                <ReportTable
                    headers={["Total", "Completed", "Scheduled", "Cancelled", "No Show", "Completion Rate", "No-show Rate", "Phone / Web"]}
                    rows={[
                        [
                            appointments.total,
                            appointments.completed,
                            appointments.scheduled,
                            appointments.cancelled,
                            appointments.noShows,
                            percent(appointments.completed, appointments.pastTotal),
                            percent(appointments.noShows, appointments.pastTotal),
                            `${appointments.phoneBookings} / ${appointments.webBookings}`,
                        ],
                    ]}
                />
            </ReportSection>

            <ReportSection title="Visits by Specialty">
                <ReportTable
                    headers={["Specialty", "Completed", "Scheduled", "Cancelled", "No Show", "Total"]}
                    alignRight={[1, 2, 3, 4, 5]}
                    rows={appointments.bySpecialty.map((s) => [s.specialty, s.completed, s.scheduled, s.cancelled, s.noShows, s.total])}
                />
            </ReportSection>

            <ReportSection title="Billing">
                <ReportTable
                    headers={["Invoices", "Billed", "Collected", "Outstanding", "Overdue", "Paid / Pending / Overdue"]}
                    rows={[
                        [
                            billing.invoiceCount,
                            money(billing.billed),
                            money(billing.collected),
                            money(billing.outstanding),
                            money(billing.overdue),
                            `${billing.paidCount} / ${billing.pendingCount} / ${billing.overdueCount}`,
                        ],
                    ]}
                />
            </ReportSection>

            <ReportSection title="Collections by Payment Type">
                <ReportTable
                    headers={["Payment Type", "Payments", "Amount"]}
                    alignRight={[1, 2]}
                    rows={billing.byPaymentType.map((t) => [t.paymentType, t.payments, money(t.amount)])}
                />
            </ReportSection>

            <ReportSection title="Unpaid Invoices">
                {billing.unpaidInvoices.length === 0 ? (
                    <p className="text-slate-500">No unpaid invoices.</p>
                ) : (
                    <ReportTable
                        headers={["Invoice", "Patient", "Issued", "Status", "Amount", "Balance"]}
                        alignRight={[4, 5]}
                        rows={billing.unpaidInvoices.map((i) => [`#${i.invoiceId}`, i.patientName, i.issueDate, i.status, money(i.amount), money(i.balance)])}
                    />
                )}
            </ReportSection>
        </PrintReport>
    );
}
