import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { Section, StatusBadge } from "../../components/ProfileUI";
import { StatCard } from "../../components/StatCard";
import { useAuth } from "../../context/AuthContext";

interface DashboardData {
  officeName: string;
  todayAppointments: number;
  unpaidInvoices: number;
  unpaidTotal: number;
  pendingInsurance: number;
  todayList: {
    appointmentId: number;
    patientId: number;
    patientName: string;
    phone: string;
    time: string;
    doctorName: string;
    status: string;
    checkedIn: boolean;
    checkedOut: boolean;
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
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hello, {user?.firstName}</h1>
        <p className="mt-1 text-gray-600">Today at the front desk{data?.officeName ? ` of ${data.officeName}` : ""}.</p>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {!data && !error && <p>Loading dashboard...</p>}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Appointments Today" value={String(data.todayAppointments)} note="Still scheduled" />
            <StatCard label="Unpaid Invoices" value={String(data.unpaidInvoices)} note={`$${data.unpaidTotal.toFixed(2)} left to collect`} />
            <StatCard label="Insurance to Verify" value={String(data.pendingInsurance)} note="Pending" />
          </div>

          <Section
            title="Today's Appointments"
            action={<Link to="/staff/reception/appointments" className="text-sm text-blue-600 hover:underline">Open appointments</Link>}
          >
            {data.todayList.length === 0 ? (
              <p className="text-gray-500">No appointments today.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full whitespace-nowrap text-left text-sm">
                  <thead>
                    <tr className="border-b text-gray-500">
                      <th className="py-2 pr-4 font-medium">Time</th>
                      <th className="py-2 pr-4 font-medium">Patient</th>
                      <th className="py-2 pr-4 font-medium">Phone</th>
                      <th className="py-2 pr-4 font-medium">Doctor</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                      <th className="py-2 font-medium">Desk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.todayList.map((a) => (
                      <tr key={a.appointmentId} className="border-b last:border-0">
                        <td className="py-2 pr-4">{a.time}</td>
                        <td className="py-2 pr-4">
                          <Link to={`/staff/reception/patients/${a.patientId}`} className="font-medium text-blue-600 hover:underline">
                            {a.patientName}
                          </Link>
                        </td>
                        <td className="py-2 pr-4">{a.phone}</td>
                        <td className="py-2 pr-4">{a.doctorName}</td>
                        <td className="py-2 pr-4"><StatusBadge status={a.status} /></td>
                        <td className="py-2">{a.checkedOut ? "Checked out" : a.checkedIn ? "Checked in" : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {data.unpaidInvoices > 0 && (
            <p className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
              {data.unpaidInvoices} invoice(s) still have a balance.{" "}
              <Link to="/staff/reception/billing" className="font-medium underline">Go to billing</Link>
            </p>
          )}
        </>
      )}
    </div>
  );
}
