import { useEffect, useState } from "react";
import { api } from "../../api";

interface DashboardSummary {
    upcomingAppointments: number;
    pendingForms: number;
    outstandingBalance: number | string;
}

export function PatientDashboard() {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadDashboard() {
            try {
                const response = await api.get<DashboardSummary>("/api/patient/dashboard");
                if (active) setSummary(response.data);
            } catch {
                if (active) setError("Dashboard information is not available yet.");
            } finally {
                if (active) setLoading(false);
            }
        }

        loadDashboard();
        return () => { active = false; };
    }, []);

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Patient Dashboard</h2>
                <p className="text-gray-600">Welcome to your patient portal.</p>
            </div>

            {loading && <p>Loading dashboard...</p>}
            {error && <p className="text-red-600">{error}</p>}

            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-5">
                        <h3 className="font-semibold">Upcoming Appointments</h3>
                        <p className="text-2xl font-bold mt-2">{summary.upcomingAppointments}</p>
                    </div>

                    <div className="border rounded-lg p-5">
                        <h3 className="font-semibold">Pending Forms</h3>
                        <p className="text-2xl font-bold mt-2">{summary.pendingForms}</p>
                    </div>

                    <div className="border rounded-lg p-5">
                        <h3 className="font-semibold">Outstanding Balance</h3>
                        <p className="text-2xl font-bold mt-2">
                            ${Number(summary.outstandingBalance).toFixed(2)}
                        </p>
                    </div>
                </div>
            )}

            <div className="border rounded-lg p-5">
                <h3 className="text-lg font-semibold">My Medical Information</h3>
                <p className="text-gray-600 mt-2">
                    View your appointments, medical records, forms, and billing through the patient portal.
                </p>
            </div>
        </div>
    );
}