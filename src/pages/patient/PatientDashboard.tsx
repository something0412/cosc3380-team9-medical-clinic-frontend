import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { PageError, PortalPage } from "../../components/PortalPage";
import { Section } from "../../components/ProfileUI";
import { StatCard } from "../../components/StatCard";
import { useAuth } from "../../context/AuthContext";

interface DashboardSummary {
  upcomingAppointments: number;
  pendingForms: number;
  outstandingBalance: string;
}

const LINKS = [
  { to: "/patient/appointments", label: "Book or cancel an appointment" },
  { to: "/patient/records", label: "See your visits, prescriptions and lab results" },
  { to: "/patient/forms", label: "Check your forms" },
  { to: "/patient/billing", label: "See your invoices and payments" },
];

export function PatientDashboard() {
  const { user } = useAuth();
  const patientId = user?.role === "patient" ? user.id : null;
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");

  // load dashboard
  useEffect(() => {
    async function loadDashboard() {
      if (!patientId) return;
      try {
        const res = await api.get<DashboardSummary>(`/api/patient/${patientId}/dashboard`);
        setSummary(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    loadDashboard();
  }, [patientId]);

  return (
    <PortalPage eyebrow="Patient Portal" title={`Hello, ${user?.firstName ?? ""}`} description="Welcome to your patient portal.">
      <PageError message={error} />
      {!summary && !error && <p className="text-slate-500">Loading dashboard...</p>}

      {summary && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Upcoming Appointments" value={String(summary.upcomingAppointments)} />
          <StatCard label="Forms to Complete" value={String(summary.pendingForms)} />
          <StatCard label="Outstanding Balance" value={`$${Number(summary.outstandingBalance).toFixed(2)}`} />
        </div>
      )}

      <Section title="Quick Links">
        <ul className="divide-y divide-slate-100 text-sm">
          {LINKS.map((l) => (
            <li key={l.to} className="py-2">
              <Link to={l.to} className="font-medium text-navy hover:text-teal-700 hover:underline">{l.label}</Link>
            </li>
          ))}
        </ul>
      </Section>
    </PortalPage>
  );
}
