import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { useAuth } from "../../context/AuthContext";

interface DashboardSummary {
    upcomingAppointments: number;
    pendingForms: number;
    outstandingBalance: number | string;
}

export function PatientDashboard() {
    const { user } = useAuth();
    const patientId = user?.role === "patient" ? user.id : null;

    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refresh, setRefresh] = useState(0);


    //load the patient's dashboard information
    useEffect(() => {
        let active = true;

        async function loadDashboard() {
            setLoading(true);
            setError("");

            if (patientId === null || !Number.isSafeInteger(patientId) || patientId <= 0) {
                if (active) {
                    setSummary(null);
                    setError("Patient information was not found. Please log in again.");
                    setLoading(false);
                }
                return;
            }

            try {
                const response = await api.get<DashboardSummary>(
                    `/api/patient/${patientId}/dashboard`
                );

                if (active) {
                    setSummary(response.data);
                    setError("");
                }

            } catch (err) {
                if (active) {
                    setSummary(null);
                    setError(apiErrorMessage(err));
                }

            } finally {
                if (active) setLoading(false);
            }
        }

        loadDashboard();

        return () => { active = false; };

    }, [patientId, refresh]);


    //format the outstanding balance
    function money(amount: number | string) {
        const value = Number(amount);

        if (!Number.isFinite(value)) return "N/A";

        return `$${value.toFixed(2)}`;
    }


    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">

            <div className="rounded-xl bg-gradient-to-r from-blue-700 to-teal-500 p-6 text-white">

                <p className="text-sm text-blue-100">
                    PATIENT PORTAL
                </p>

                <h2 className="text-2xl font-bold mt-2">
                    Welcome back, {user?.firstName || "Patient"}!
                </h2>

                <p className="mt-2 text-blue-100">
                    Here is an overview of your medical information.
                </p>

            </div>


            <div className="flex justify-end">

                <button
                    type="button"
                    onClick={() => setRefresh(n => n + 1)}
                    disabled={loading}
                    className="border rounded-lg px-4 py-2 hover:bg-gray-100 disabled:opacity-50"
                >
                    {loading ? "Loading..." : "Refresh Dashboard"}
                </button>

            </div>


            {loading && (
                <p>Loading dashboard...</p>
            )}

            {error && (
                <p className="text-red-600" role="alert">
                    {error}
                </p>
            )}


            {summary && !loading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    <div className="bg-white border rounded-xl p-5">

                        <h3 className="font-semibold text-slate-700">
                            Upcoming Appointments
                        </h3>

                        <p className="text-3xl font-bold mt-3 text-blue-700">
                            {summary.upcomingAppointments}
                        </p>

                        <Link
                            to="/patient/appointments"
                            className="text-sm text-blue-600 hover:underline mt-3 inline-block"
                        >
                            View Appointments
                        </Link>

                    </div>


                    <div className="bg-white border rounded-xl p-5">

                        <h3 className="font-semibold text-slate-700">
                            Pending Forms
                        </h3>

                        <p className="text-3xl font-bold mt-3 text-blue-700">
                            {summary.pendingForms}
                        </p>

                        <Link
                            to="/patient/forms"
                            className="text-sm text-blue-600 hover:underline mt-3 inline-block"
                        >
                            View Forms
                        </Link>

                    </div>


                    <div className="bg-white border rounded-xl p-5">

                        <h3 className="font-semibold text-slate-700">
                            Outstanding Balance
                        </h3>

                        <p className="text-3xl font-bold mt-3 text-blue-700">
                            {money(summary.outstandingBalance)}
                        </p>

                        <Link
                            to="/patient/billing"
                            className="text-sm text-blue-600 hover:underline mt-3 inline-block"
                        >
                            View Billing
                        </Link>

                    </div>

                </div>
            )}


            <div className="bg-white border rounded-xl p-6">

                <h3 className="text-xl font-semibold text-slate-800">
                    My Medical Information
                </h3>

                <p className="text-gray-600 mt-2">
                    Access your appointments, medical records, forms, and billing information.
                </p>


                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">

                    <Link
                        to="/patient/appointments"
                        className="border rounded-lg p-4 hover:bg-blue-50 text-blue-700 font-medium"
                    >
                        My Appointments
                    </Link>

                    <Link
                        to="/patient/records"
                        className="border rounded-lg p-4 hover:bg-blue-50 text-blue-700 font-medium"
                    >
                        Medical Records
                    </Link>

                    <Link
                        to="/patient/forms"
                        className="border rounded-lg p-4 hover:bg-blue-50 text-blue-700 font-medium"
                    >
                        Patient Forms
                    </Link>

                    <Link
                        to="/patient/billing"
                        className="border rounded-lg p-4 hover:bg-blue-50 text-blue-700 font-medium"
                    >
                        Billing & Payments
                    </Link>

                </div>

            </div>

        </div>
    );
}