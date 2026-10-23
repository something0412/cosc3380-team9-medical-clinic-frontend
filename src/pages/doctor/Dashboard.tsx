import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { Section } from "../../components/ProfileUI";
import { StatCard } from "../../components/StatCard";
import { useAuth } from "../../context/AuthContext";

interface DashboardData {
  myPatients: number;
  todayAppointments: number;
  pendingLabs: number;
  referralsToReview: number;
  upcomingAppointments: {
    appointmentId: number;
    patientId: number;
    patientName: string;
    date: string;
    time: string;
    specialty: string;
  }[];
  recentResults: {
    labOrderId: number;
    patientId: number;
    patientName: string;
    testName: string;
    orderDate: string;
  }[];
}

export function DoctorDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  // load dashboard
  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.get<DashboardData>("/api/doctor/dashboard");
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
        <h1 className="text-2xl font-bold text-gray-900">Hello, Dr. {user?.lastName}</h1>
        <p className="mt-1 text-gray-600">Here's what's happening today.</p>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {!data && !error && <p>Loading dashboard...</p>}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="My Patients" value={String(data.myPatients)} note="Assigned to you" />
            <StatCard label="Appointments Today" value={String(data.todayAppointments)} />
            <StatCard label="Labs Waiting" value={String(data.pendingLabs)} note="Ordered, no result yet" />
            <StatCard label="Referrals to Review" value={String(data.referralsToReview)} note="Sent to you" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Section title="Upcoming Appointments" action={<Link to="/doctor/appointments" className="text-sm text-blue-600 hover:underline">View all</Link>}>
              {data.upcomingAppointments.length === 0 ? (
                <p className="text-gray-500">No upcoming appointments.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {data.upcomingAppointments.map((a) => (
                    <li key={a.appointmentId} className="flex justify-between py-2 text-sm">
                      <Link to={`/doctor/appointments/${a.appointmentId}`} className="font-medium text-blue-600 hover:underline">
                        {a.patientName}
                      </Link>
                      <span className="text-gray-600">
                        {a.date} · {a.time} · {a.specialty}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Recent Lab Results" action={<Link to="/doctor/lab-orders" className="text-sm text-blue-600 hover:underline">View all</Link>}>
              {data.recentResults.length === 0 ? (
                <p className="text-gray-500">No lab results yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {data.recentResults.map((r) => (
                    <li key={r.labOrderId} className="flex justify-between py-2 text-sm">
                      <span>
                        <span className="font-medium text-gray-900">{r.testName}</span>
                        {" · "}
                        <Link to={`/doctor/patients/${r.patientId}`} className="text-blue-600 hover:underline">
                          {r.patientName}
                        </Link>
                      </span>
                      <span className="text-gray-600">{r.orderDate}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          {data.referralsToReview > 0 && (
            <p className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
              You have {data.referralsToReview} referral(s) waiting for your answer.{" "}
              <Link to="/doctor/referrals" className="font-medium underline">Review them</Link>
            </p>
          )}
        </>
      )}
    </div>
  );
}
