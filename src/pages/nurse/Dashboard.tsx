import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { Section } from "../../components/ProfileUI";
import { StatCard } from "../../components/StatCard";
import { useAuth } from "../../context/AuthContext";

interface DashboardData {
  todayAppointments: number;
  waitingForVitals: number;
  criticalToday: number;
  lowStock: number;
  waitingList: {
    appointmentId: number;
    patientName: string;
    time: string;
    doctorName: string;
  }[];
}

export function NurseDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  // load dashboard
  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.get<DashboardData>("/api/nurse/dashboard");
        setData(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    loadDashboard();
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hello, {user?.firstName}</h1>
        <p className="mt-1 text-gray-600">Today's work at your office.</p>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {!data && !error && <p>Loading dashboard...</p>}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Appointments Today" value={String(data.todayAppointments)} note="At your office" />
            <StatCard label="Waiting for Vitals" value={String(data.waitingForVitals)} />
            <StatCard label="Critical Vitals Today" value={String(data.criticalToday)} />
            <StatCard label="Low Stock Supplies" value={String(data.lowStock)} note="At or below reorder level" />
          </div>

          {data.criticalToday > 0 && (
            <p className="rounded-lg border-2 border-red-500 bg-red-50 p-4 text-sm font-medium text-red-900">
              🚨 {data.criticalToday} vitals reading(s) today were critical. Let the doctor know.
            </p>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Section
              title="Waiting for Vitals"
              action={<Link to="/staff/nurse/today" className="text-sm text-blue-600 hover:underline">View all</Link>}
            >
              {data.waitingList.length === 0 ? (
                <p className="text-gray-500">Nobody is waiting for vitals.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {data.waitingList.map((a) => (
                    <li key={a.appointmentId} className="flex justify-between py-2 text-sm">
                      <Link to={`/staff/nurse/today/${a.appointmentId}`} className="font-medium text-blue-600 hover:underline">
                        {a.patientName}
                      </Link>
                      <span className="text-gray-600">
                        {a.time} · Dr. {a.doctorName}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section
              title="Supplies"
              action={<Link to="/staff/nurse/supplies" className="text-sm text-blue-600 hover:underline">Open supplies</Link>}
            >
              {data.lowStock === 0 ? (
                <p className="text-gray-500">All supplies are stocked.</p>
              ) : (
                <p className="text-sm text-yellow-900">
                  {data.lowStock} supply item(s) are running low. Check the supplies page to order more.
                </p>
              )}
            </Section>
          </div>
        </>
      )}
    </div>
  );
}
