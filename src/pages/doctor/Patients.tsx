import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { ADMIN_PRIMARY_BUTTON } from "../../components/admin/styles";
import { Field } from "../../components/FormControls";
import { PageError, PortalPage } from "../../components/PortalPage";
import { StatusBadge } from "../../components/ProfileUI";
import { formatId } from "../../utils/id";

interface MyPatient {
  patientId: number;
  firstName: string;
  lastName: string;
  dob: string;
  assignedToMe: boolean;
  lastVisit: string | null;
  nextVisit: string | null;
}

export function DoctorPatients() {
  const [patients, setPatients] = useState<MyPatient[]>([]);
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // load my patients
  useEffect(() => {
    async function loadPatients() {
      try {
        const res = await api.get<MyPatient[]>("/api/doctor/patients", { params: { search } });
        setPatients(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, [search]);

  // search by name
  function handleSearch(e: FormEvent) {
    e.preventDefault();
    setSearch(searchText);
  }

  return (
    <PortalPage eyebrow="Doctor" title="Patients" description="Patients assigned to you or with a booked or finished visit with you.">
      <form onSubmit={handleSearch} className="grid gap-4 rounded-lg shadow-box bg-slate-50 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label="Search" type="search" placeholder="Patient name" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        <button type="submit" className={ADMIN_PRIMARY_BUTTON}>Search</button>
      </form>

      <PageError message={error} />

      <section className="overflow-hidden rounded-lg shadow-box bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Patient ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Date of Birth</th>
                <th className="px-4 py-3">Last Visit</th>
                <th className="px-4 py-3">Next Visit</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Loading patients...</td></tr>
              ) : patients.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No patients found.</td></tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.patientId} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-slate-500">{formatId(p.patientId)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-navy">
                      {p.lastName}, {p.firstName}
                      {p.assignedToMe && <span className="ml-2"><StatusBadge status="Primary" /></span>}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{p.dob}</td>
                    <td className="px-4 py-3 text-slate-700">{p.lastVisit ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{p.nextVisit ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/doctor/patients/${p.patientId}`} className="whitespace-nowrap font-medium text-navy hover:text-teal-700 hover:underline">
                        Open chart
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </PortalPage>
  );
}
