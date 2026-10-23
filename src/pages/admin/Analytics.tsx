import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "../../api";
import { BarChart } from "../../components/BarChart";
import { Section, StatusBadge } from "../../components/ProfileUI";
import { StatCard } from "../../components/StatCard";
import { CHART_COLORS } from "../../utils/chartColors";

type Tab = "appointments" | "billing";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const THIS_YEAR = new Date().getFullYear();
const YEARS = [THIS_YEAR, THIS_YEAR - 1, THIS_YEAR - 2];

const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });
const percent = (part: number, whole: number) => (whole ? `${((part / whole) * 100).toFixed(1)}%` : "0%");

export function AdminAnalytics() {
    const [tab, setTab] = useState<Tab>("appointments");

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="mt-1 text-gray-600">Overview of clinic analytics.</p>
            </div>

            <div className="flex gap-6 border-b border-gray-200">
                {([["appointments", "Appointment Activity"], ["billing", "Billing & Collections"]] as [Tab, string][]).map(([key, label]) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setTab(key)}
                        className={`-mb-px border-b-2 pb-3 text-sm font-medium ${
                            tab === key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {tab === "appointments" ? <AppointmentActivity /> : <BillingCollections />}
        </div>
    );
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

function AppointmentActivity() {
    const [data, setData] = useState<AppointmentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // load appointment activity
    useEffect(() => {
        let active = true;

        async function loadAppointments() {
            try {
                const res = await api.get<AppointmentData>("/api/admin/analytics/appointments");
                if (active) setData(res.data);
            } catch (err) {
                if (active) setError(apiErrorMessage(err));
            } finally {
                if (active) setLoading(false);
            }
        }

        loadAppointments();
        return () => {
            active = false;
        };
    }, []);

    if (loading) return <p>Loading appointment activity...</p>;
    if (error) return <p className="text-red-600">{error}</p>;
    if (!data) return null;

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
                <div className="flex h-4 overflow-hidden rounded-full bg-gray-100">
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
                                <p className="text-sm text-gray-500">{c.name}</p>
                                <p className="text-2xl font-bold text-gray-900">{percent(c.count, data.total)}</p>
                                <p className="text-xs text-gray-400">{c.count} appointments</p>
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
                            <tr className="border-b text-gray-500">
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
                                    <td className="p-2 font-medium text-gray-900">{s.specialty}</td>
                                    <td className="p-2 text-right">{s.completed}</td>
                                    <td className="p-2 text-right">{s.scheduled}</td>
                                    <td className="p-2 text-right">{s.cancelled}</td>
                                    <td className="p-2 text-right">{s.noShows}</td>
                                    <td className="p-2 text-right font-medium">{s.total}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="font-semibold text-gray-900">
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

function BillingCollections() {
    const [year, setYear] = useState(THIS_YEAR);
    const [data, setData] = useState<BillingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // load billing
    useEffect(() => {
        let active = true;

        async function loadBilling() {
            try {
                const res = await api.get<BillingData>("/api/admin/analytics/billing", { params: { year } });
                if (active) setData(res.data);
            } catch (err) {
                if (active) setError(apiErrorMessage(err));
            } finally {
                if (active) setLoading(false);
            }
        }

        loadBilling();
        return () => {
            active = false;
        };
    }, [year]);

    if (loading) return <p>Loading billing...</p>;
    if (error) return <p className="text-red-600">{error}</p>;
    if (!data) return null;

    const maxTypeAmount = Math.max(1, ...data.byPaymentType.map((t) => t.amount));

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Billed" value={money(data.billed)} note={`${data.invoiceCount} invoices`} />
                <StatCard label="Collected" value={money(data.collected)} note={`${percent(data.collected, data.billed)} of billed`} />
                <StatCard label="Outstanding" value={money(data.outstanding)} note={`${data.pendingCount + data.overdueCount} unpaid invoices`} />
                <StatCard label="Overdue" value={money(data.overdue)} note={`${data.overdueCount} overdue invoices`} />
            </div>

            <Section
                title={`Billed vs Collected in ${data.year}`}
                action={
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"
                        aria-label="Year"
                    >
                        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                }
            >
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
                                    <span className="text-gray-700">{t.paymentType}</span>
                                    <span className="font-medium text-gray-900">
                                        {money(t.amount)} <span className="font-normal text-gray-400">· {t.payments} payments</span>
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-gray-100">
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
                                <span className="text-sm text-gray-700">
                                    <span className="font-medium text-gray-900">{count}</span> ({percent(Number(count), data.invoiceCount)})
                                </span>
                            </li>
                        ))}
                    </ul>
                </Section>
            </div>

            <Section title="Unpaid Invoices">
                {data.unpaidInvoices.length === 0 ? (
                    <p className="text-gray-500">No unpaid invoices.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b text-gray-500">
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
                                        <td className="p-2 font-medium text-gray-900">{i.patientName}</td>
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
