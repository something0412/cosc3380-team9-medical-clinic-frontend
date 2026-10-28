import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "../../api";
import { PageError, PortalPage } from "../../components/PortalPage";
import { NotAvailable, Section, StatusBadge } from "../../components/ProfileUI";
import { StatCard } from "../../components/StatCard";
import { useAuth } from "../../context/AuthContext";

interface PatientForm {
  formTypeId: number;
  name: string;
  isRequired: boolean;
  status: string | null;
  submittedDate: string | null;
}

export function PatientForms() {
  const { user } = useAuth();
  const patientId = user?.role === "patient" ? user.id : null;
  const [forms, setForms] = useState<PatientForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // load my forms
  useEffect(() => {
    async function loadForms() {
      if (!patientId) return;
      try {
        const res = await api.get<PatientForm[]>(`/api/patient/${patientId}/forms`);
        setForms(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadForms();
  }, [patientId]);

  const requiredForms = forms.filter((f) => f.isRequired);
  const completedForms = forms.filter((f) => f.status === "Completed");

  return (
    <PortalPage eyebrow="Patient Portal" title="My Forms" description="Your required forms and whether they're done. The front desk marks paper forms as completed.">
      <PageError message={error} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCard label="Required Forms" value={String(requiredForms.length)} />
        <StatCard label="Completed Forms" value={String(completedForms.length)} />
      </div>

      <Section title="Forms">
        {loading ? (
          <p className="text-slate-500">Loading forms...</p>
        ) : forms.length === 0 ? (
          <p className="text-slate-500">No forms.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Form</th>
                  <th className="px-4 py-3">Required</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {forms.map((f) => (
                  <tr key={f.formTypeId}>
                    <td className="px-4 py-3 font-medium text-slate-900">{f.name}</td>
                    <td className="px-4 py-3 text-slate-700">{f.isRequired ? "Yes" : "No"}</td>
                    <td className="px-4 py-3"><StatusBadge status={f.status ?? "Not started"} /></td>
                    <td className="px-4 py-3 text-slate-700">{f.submittedDate ?? <NotAvailable />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </PortalPage>
  );
}
