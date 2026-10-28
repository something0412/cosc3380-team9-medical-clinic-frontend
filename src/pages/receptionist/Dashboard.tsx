import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { PageError, PortalPage } from "../../components/PortalPage";
import { Section, StatusBadge, WarningBox } from "../../components/ProfileUI";
import { StatCard } from "../../components/StatCard";
import { useAuth } from "../../context/AuthContext";

interface DashboardData {
  officeName: string;
  todayAppointments: number;
  unpaidInvoices: number;
  unpaidTotal: string;
  pendingInsurance: number;
  todayList: {
    appointmentId: number;
    patientId: number;
    patientName: string;
    startTime: string;
    doctorName: string;
    status: string;
    checkedIn: boolean;
    checkedOutAt: string | null;
  }[];
}

export function ReceptionistDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  // load dashboard
  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.get<DashboardData>("/api/receptionist/dashboard");
        setData(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    loadDashboard();
  }, []);

  return (
    <PortalPage
      eyebrow="Front Desk"
      title={`Hello, ${user?.firstName ?? ""}`}
      description={`Today at the front desk${data?.officeName ? ` of ${data.officeName}` : ""}.`}
    >
      <PageError message={error} />
      {!data && !error && <p className="text-slate-500">Loading dashboard...</p>}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Appointments Today" value={String(data.todayAppointments)} note="Still scheduled" />
            <StatCard label="Unpaid Invoices" value={String(data.unpaidInvoices)} note={`$${Number(data.unpaidTotal).toFixed(2)} left to collect`} />
            <StatCard label="Insurance to Verify" value={String(data.pendingInsurance)} note="Pending" />
          </div>

          <Section
            title="Today's Appointments"
            action={<Link to="/staff/reception/appointments" className="text-sm font-medium text-navy hover:text-teal-700 hover:underline">Open appointments</Link>}
          >
            {data.todayList.length === 0 ? (
              <p className="text-slate-500">No appointments today.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Doctor</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.todayList.map((a) => (
                      <tr key={a.appointmentId} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-700">{a.startTime}</td>
                        <td className="px-4 py-3">
                          <Link to={`/staff/reception/patients/${a.patientId}`} className="font-medium text-navy hover:text-teal-700 hover:underline">
                            {a.patientName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-slate-700">Dr. {a.doctorName}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={a.status === "Scheduled" && a.checkedIn ? "Checked In" : a.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {data.unpaidInvoices > 0 && (
            <WarningBox>
              {data.unpaidInvoices} invoice(s) still have a balance.{" "}
              <Link to="/staff/reception/billing" className="font-medium underline">Go to billing</Link>
            </WarningBox>
          )}
        </>
      )}
    </PortalPage>
  );
}
