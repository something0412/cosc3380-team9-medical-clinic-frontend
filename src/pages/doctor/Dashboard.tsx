import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { PageError, PortalPage } from "../../components/PortalPage";
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
    startTime: string;
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
    <PortalPage eyebrow="Doctor" title={`Hello, Dr. ${user?.lastName ?? ""}`} description="Here's what's happening today.">

      <PageError message={error} />
      {!data && !error && <p className="text-slate-500">Loading dashboard...</p>}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="My Patients" value={String(data.myPatients)} note="Assigned to you" />
            <StatCard label="Appointments Today" value={String(data.todayAppointments)} />
            <StatCard label="Labs Waiting" value={String(data.pendingLabs)} note="Ordered, no result yet" />
            <StatCard label="Referrals to Review" value={String(data.referralsToReview)} note="Sent to you" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Section title="Upcoming Appointments" action={<Link to="/doctor/appointments" className="text-sm font-medium text-navy hover:text-teal-700 hover:underline">View all</Link>}>
              {data.upcomingAppointments.length === 0 ? (
                <p className="text-slate-500">No upcoming appointments.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.upcomingAppointments.map((a) => (
                    <li key={a.appointmentId} className="flex justify-between py-2 text-sm">
                      <Link to={`/doctor/appointments/${a.appointmentId}`} className="font-medium font-medium text-navy hover:text-teal-700 hover:underline">
                        {a.patientName}
                      </Link>
                      <span className="text-slate-600">
                        {a.date} · {a.startTime} · {a.specialty}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Recent Lab Results" action={<Link to="/doctor/lab-orders" className="text-sm font-medium text-navy hover:text-teal-700 hover:underline">View all</Link>}>
              {data.recentResults.length === 0 ? (
                <p className="text-slate-500">No lab results yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.recentResults.map((r) => (
                    <li key={r.labOrderId} className="flex justify-between py-2 text-sm">
                      <span>
                        <span className="font-medium text-slate-900">{r.testName}</span>
                        {" · "}
                        <Link to={`/doctor/patients/${r.patientId}`} className="font-medium text-navy hover:text-teal-700 hover:underline">
                          {r.patientName}
                        </Link>
                      </span>
                      <span className="text-slate-600">{r.orderDate}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>

          {data.referralsToReview > 0 && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              You have {data.referralsToReview} referral(s) waiting for your answer.{" "}
              <Link to="/doctor/referrals" className="font-medium underline">Review them</Link>
            </p>
          )}
        </>
      )}
    </PortalPage>
  );
}
