import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "../../api";
import { AdminPage } from "../../components/admin/AdminPage";
import { SelectField } from "../../components/FormControls";
import { PageError } from "../../components/PortalPage";
import { StatusBadge, TextButton } from "../../components/ProfileUI";
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

    return (
        <AdminPage title="Patients" description="Activate or deactivate patient accounts.">
            <div className="w-48">
                <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="all">All</option>
                </SelectField>
            </div>

            <PageError message={error} />

            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full whitespace-nowrap text-left text-sm">
                    <thead className="bg-slate-50">
                        <tr className="border-b text-slate-500">
                            <th className="p-3 font-medium">Name</th>
                            <th className="p-3 font-medium">Patient ID</th>
                            <th className="p-3 font-medium">Joined</th>
                            <th className="p-3 font-medium">Phone</th>
                            <th className="p-3 font-medium">Primary Doctor</th>
                            <th className="p-3 font-medium">Status</th>
                            <th className="p-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className="p-3 text-slate-500">Loading patients...</td></tr>
                        ) : patients.length === 0 ? (
                            <tr><td colSpan={7} className="p-3 text-slate-500">No patients match this filter.</td></tr>
                        ) : (
                            patients.map((p) => (
                                <tr key={p.patientId} className="border-b last:border-0">
                                    <td className="p-3 font-medium text-slate-900">{p.lastName}, {p.firstName}</td>
                                    <td className="p-3">{formatId(p.patientId)}</td>
                                    <td className="p-3">{p.joinedDate ?? ""}</td>
                                    <td className="p-3">{p.phone}</td>
                                    <td className="p-3">{p.primaryDoctor ? `Dr. ${p.primaryDoctor}` : ""}</td>
                                    <td className="p-3"><StatusBadge status={p.isActive ? "Active" : "Inactive"} /></td>
                                    <td className="p-3">
                                        <TextButton danger={p.isActive} onClick={() => toggleStatus(p)}>
                                            {p.isActive ? "Deactivate" : "Activate"}
                                        </TextButton>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </AdminPage>
    );
}
