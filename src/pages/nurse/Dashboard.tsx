import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { PageError, PortalPage } from "../../components/PortalPage";
import { Section } from "../../components/ProfileUI";
import { StatCard } from "../../components/StatCard";
import { useAuth } from "../../context/AuthContext";

interface DashboardData {
  todayAppointments: number;
  notArrived: number;
  checkedIn: number;
  completed: number;
  waitingForVitals: number;
  waitingList: {
    appointmentId: number;
    patientName: string;
    startTime: string;
    doctorName: string;
    checkedInAt: string | null;
  }[];
}

export function NurseDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [lowStock, setLowStock] = useState(0);
  const [error, setError] = useState("");

  // load dashboard and count low stock supplies
  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.get<DashboardData>("/api/nurse/dashboard");
        setData(res.data);
        const suppliesRes = await api.get<{ lowStock: boolean }[]>("/api/nurse/supplies");
        setLowStock(suppliesRes.data.filter((s) => s.lowStock).length);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    loadDashboard();
  }, []);

  return (
    <PortalPage eyebrow="Nursing" title={`Hello, ${user?.firstName ?? ""}`} description="Today's work at your office.">
      <PageError message={error} />
      {!data && !error && <p className="text-slate-500">Loading dashboard...</p>}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Appointments Today" value={String(data.todayAppointments)} note={`${data.completed} completed`} />
            <StatCard label="Not Arrived Yet" value={String(data.notArrived)} />
            <StatCard label="Waiting for Vitals" value={String(data.waitingForVitals)} note={`${data.checkedIn} checked in`} />
            <StatCard label="Low Stock Supplies" value={String(lowStock)} note="At or below reorder level" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Section
              title="Waiting for Vitals"
              action={<Link to="/staff/nurse/appointments" className="text-sm font-medium text-navy hover:text-teal-700 hover:underline">View all</Link>}
            >
              {data.waitingList.length === 0 ? (
                <p className="text-slate-500">Nobody checked in is waiting for vitals.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.waitingList.map((a) => (
                    <li key={a.appointmentId} className="flex justify-between py-2 text-sm">
                      <Link to={`/staff/nurse/appointments/${a.appointmentId}`} className="font-medium text-navy hover:text-teal-700 hover:underline">
                        {a.patientName}
                      </Link>
                      <span className="text-slate-600">
                        {a.startTime} · Dr. {a.doctorName}
                        {a.checkedInAt && ` · arrived ${a.checkedInAt.slice(11)}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section
              title="Supplies"
              action={<Link to="/staff/nurse/supplies" className="text-sm font-medium text-navy hover:text-teal-700 hover:underline">Open supplies</Link>}
            >
              {lowStock === 0 ? (
                <p className="text-slate-500">All supplies are stocked.</p>
              ) : (
                <p className="text-sm text-amber-900">{lowStock} supply item(s) are running low. Check the supplies page to order more.</p>
              )}
            </Section>
          </div>
        </>
      )}
    </PortalPage>
  );
}
