import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "../../api";
import { BarChart } from "../../components/BarChart";
import { Section } from "../../components/ProfileUI";
import { StatCard } from "../../components/StatCard";

interface DashboardData {
    activePatients: number;
    upcomingVisits: number;
    collected: number;
    pending: number;
    year: number;
    signupsByMonth: { month: number; signups: number }[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const THIS_YEAR = new Date().getFullYear();
const YEARS = [THIS_YEAR, THIS_YEAR - 1, THIS_YEAR - 2];

const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });

export function AdminDashboard() {
    const [year, setYear] = useState(THIS_YEAR);
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // load dashboard
    useEffect(() => {
        let active = true;

        async function loadDashboard() {
            try {
                const res = await api.get<DashboardData>("/api/admin/dashboard", { params: { year } });
                if (active) setData(res.data);
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

    const totalSignups = data?.signupsByMonth.reduce((sum, m) => sum + m.signups, 0) ?? 0;

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-gray-600">Overview of clinic activity.</p>
            </div>

            {loading && <p>Loading dashboard...</p>}
            {error && <p className="text-red-600">{error}</p>}

            {data && (
                <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard label="Active Patients" value={data.activePatients.toLocaleString()} />
                        <StatCard label="Upcoming Visits" value={data.upcomingVisits.toLocaleString()} note="Scheduled from now on" />
                        <StatCard label="Collected" value={money(data.collected)} note="All payments received" />
                        <StatCard label="Pending" value={money(data.pending)} note="Unpaid invoice balances" />
                    </div>

                    <Section
                        title={`Patient Sign-ups in ${data.year}`}
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
                        <p className="mb-4 text-sm text-gray-500">{totalSignups} new patient accounts this year</p>
                        <BarChart
                            labels={MONTHS}
                            series={[{ name: "Sign-ups", values: data.signupsByMonth.map((m) => m.signups) }]}
                        />
                    </Section>
                </>
            )}
        </div>
    );
}
