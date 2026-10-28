import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { AdminPage } from "../../components/admin/AdminPage";
import { ActiveBadge } from "../../components/admin/StatusBadges";
import { Field, SelectField } from "../../components/FormControls";
import { PageError } from "../../components/PortalPage";
import { TextButton } from "../../components/ProfileUI";
import { formatId } from "../../utils/id";

interface PatientRow {
    patientId: number;
    firstName: string;
    lastName: string;
    joinedDate: string | null;
    phone: string;
    primaryDoctor: string | null;
    isActive: boolean;
}

type StatusFilter = "active" | "inactive" | "all";

export function AdminPatients() {
    const [status, setStatus] = useState<StatusFilter>("active");
    const [search, setSearch] = useState("");
    const [patients, setPatients] = useState<PatientRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloadCount, setReloadCount] = useState(0);

    // load patient list
    useEffect(() => {
        let active = true;

        async function loadPatients() {
            try {
                const res = await api.get<PatientRow[]>("/api/admin/patients", { params: { status } });
                if (active) {
                    setPatients(res.data);
                    setError("");
                }
            } catch (err) {
                if (active) setError(apiErrorMessage(err));
            } finally {
                if (active) setLoading(false);
            }
        }

        loadPatients();
        return () => {
            active = false;
        };
    }, [status, reloadCount]);

    // activate or deactivate
    async function toggleStatus(patient: PatientRow) {
        const action = patient.isActive ? "Deactivate" : "Activate";
        if (!window.confirm(`${action} ${patient.firstName} ${patient.lastName}'s account?`)) return;
        try {
            await api.patch(`/api/admin/patients/${patient.patientId}/status`, { isActive: !patient.isActive });
            setReloadCount((c) => c + 1);
        } catch (err) {
            setError(apiErrorMessage(err));
        }
    }

    // search by name, patient ID or phone
    const query = search.trim().toLowerCase();
    const filtered = patients.filter(
        (p) =>
            !query ||
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(query) ||
            formatId(p.patientId).includes(query) ||
            (p.phone ?? "").includes(query)
    );

    const hasFilters = query !== "" || status !== "active";

    function clearFilters() {
        setSearch("");
        setStatus("active");
    }

    return (
        <AdminPage title="Patients" description="View patient accounts, edit their primary doctor or password, and activate or deactivate them.">
            <div className="grid gap-4 rounded-lg shadow-box bg-slate-50 p-4 sm:grid-cols-[2fr_1fr]">
                <Field
                    label="Search"
                    type="search"
                    placeholder="Name, patient ID or phone"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="all">All statuses</option>
                </SelectField>
            </div>

            <PageError message={error} />

            <section className="overflow-hidden rounded-lg shadow-box bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 text-sm text-slate-600">
                    <span>{loading ? "Loading patients..." : `Showing ${filtered.length} of ${patients.length} patients`}</span>
                    {hasFilters && (
                        <button type="button" onClick={clearFilters} className="font-medium text-navy hover:text-teal-700">
                            Clear filters
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="whitespace-nowrap bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <tr>
                                <th className="px-4 py-3">Patient ID</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Joined</th>
                                <th className="px-4 py-3">Phone</th>
                                <th className="px-4 py-3">Primary Doctor</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                                        {patients.length === 0 ? "No patients found." : "No patients match your search and filters."}
                                    </td>
                                </tr>
                            )}
                            {filtered.map((p) => (
                                <tr key={p.patientId} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-mono text-slate-500">{formatId(p.patientId)}</td>
                                    <td className="whitespace-nowrap px-4 py-3 font-medium text-navy">{p.firstName} {p.lastName}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{p.joinedDate ?? "—"}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{p.phone}</td>
                                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{p.primaryDoctor ? `Dr. ${p.primaryDoctor}` : "—"}</td>
                                    <td className="px-4 py-3"><ActiveBadge isActive={p.isActive} /></td>
                                    <td className="whitespace-nowrap px-4 py-3 text-right">
                                        <Link to={`/admin/patients/${p.patientId}/edit`} className="mr-4 text-sm font-medium text-navy hover:text-teal-700">
                                            Edit
                                        </Link>
                                        <TextButton danger={p.isActive} className="whitespace-nowrap" onClick={() => toggleStatus(p)}>
                                            {p.isActive ? "Deactivate" : "Activate"}
                                        </TextButton>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </AdminPage>
    );
}
