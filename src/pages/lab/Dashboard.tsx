import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { Section, StatusBadge } from "../../components/ProfileUI";
import { StatCard } from "../../components/StatCard";
import { useAuth } from "../../context/AuthContext";

interface DashboardData {
  waiting: number;
  inProgress: number;
  completedToday: number;
  myWeek: number;
  oldestWaiting: {
    labOrderId: number;
    patientName: string;
    testName: string;
    orderedBy: string;
    orderDate: string;
    daysWaiting: number;
    status: string;
  }[];
}

export function LabDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  // load dashboard
  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.get<DashboardData>("/api/lab/dashboard");
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
        <p className="mt-1 text-gray-600">Here's the lab work waiting today.</p>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {!data && !error && <p>Loading dashboard...</p>}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Waiting" value={String(data.waiting)} note="Not started yet" />
            <StatCard label="In Progress" value={String(data.inProgress)} note="Sample collected" />
            <StatCard label="Completed Today" value={String(data.completedToday)} />
            <StatCard label="My Results" value={String(data.myWeek)} note="Last 7 days" />
          </div>

          <Section title="Waiting the Longest" action={<Link to="/lab/orders" className="text-sm text-blue-600 hover:underline">View all</Link>}>
            {data.oldestWaiting.length === 0 ? (
              <p className="text-gray-500">No lab orders are waiting.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data.oldestWaiting.map((o) => (
                  <li key={o.labOrderId} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900">{o.testName}</span>
                      <StatusBadge status={o.status} />
                      <span className="text-gray-700">{o.patientName}</span>
                      <span className="text-gray-500">ordered by Dr. {o.orderedBy}</span>
                    </span>
                    <span className="text-gray-600">
                      {o.orderDate} · {o.daysWaiting === 0 ? "today" : `${o.daysWaiting} day(s) ago`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </>
      )}
    </div>
  );
}
