import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, apiErrorMessage } from "../../api";
import { ErrorText, Field, SelectField } from "../../components/FormControls";
import { Modal } from "../../components/Modal";
import { FormActions, PrimaryButton, StatusBadge, TextButton } from "../../components/ProfileUI";
import { useAuth } from "../../context/AuthContext";
import { formatId } from "../../utils/id";

interface StaffMember {
    employeeId: number;
    firstName: string;
    lastName: string;
    role: string;
    roleDetail: string | null;
    officeId: number;
    officeName: string;
    phone: string;
    email: string;
    isActive: boolean;
}

interface StaffOptions {
    roles: { employeeTypeId: number; name: string }[];
    offices: { officeId: number; name: string }[];
    specialties: { specialtyId: number; name: string }[];
}

type StatusFilter = "active" | "inactive" | "all";
type ModalState = { mode: "add" } | { mode: "edit"; staff: StaffMember } | null;

const NURSING_LEVELS = ["RN", "LPN", "NP", "CNA"];

export function AdminStaff() {
    const { user } = useAuth();
    const [status, setStatus] = useState<StatusFilter>("active");
    const [role, setRole] = useState("all");
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [options, setOptions] = useState<StaffOptions>({ roles: [], offices: [], specialties: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloadCount, setReloadCount] = useState(0);
    const [modal, setModal] = useState<ModalState>(null);

    // load roles, offices and specialties
    useEffect(() => {
        async function loadOptions() {
            try {
                const res = await api.get<StaffOptions>("/api/admin/staff/options");
                setOptions(res.data);
            } catch (err) {
                setError(apiErrorMessage(err));
            }
        }
        loadOptions();
    }, []);

    // load staff list
    useEffect(() => {
        let active = true;

        async function loadStaff() {
            try {
                const res = await api.get<StaffMember[]>("/api/admin/staff", { params: { status, role } });
                if (active) {
                    setStaff(res.data);
                    setError("");
                }
            } catch (err) {
                if (active) setError(apiErrorMessage(err));
            } finally {
                if (active) setLoading(false);
            }
        }

        loadStaff();
        return () => {
            active = false;
        };
    }, [status, role, reloadCount]);

    // activate or deactivate
    async function toggleStatus(member: StaffMember) {
        const action = member.isActive ? "Deactivate" : "Activate";
        if (!window.confirm(`${action} ${member.firstName} ${member.lastName}'s account?`)) return;
        try {
            await api.patch(`/api/admin/staff/${member.employeeId}/status`, { isActive: !member.isActive });
            setReloadCount((c) => c + 1);
        } catch (err) {
            setError(apiErrorMessage(err));
        }
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
                    <p className="mt-1 text-gray-600">Manage employee accounts.</p>
                </div>
                <PrimaryButton type="button" onClick={() => setModal({ mode: "add" })}>
                    Add Employee
                </PrimaryButton>
            </div>

            <div className="flex flex-wrap gap-4">
                <div className="w-48">
                    <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="all">All</option>
                    </SelectField>
                </div>
                <div className="w-48">
                    <SelectField label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
                        <option value="all">All roles</option>
                        {options.roles.map((r) => <option key={r.employeeTypeId} value={r.name}>{r.name}</option>)}
                    </SelectField>
                </div>
            </div>

            {error && <p className="text-red-600">{error}</p>}

            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="w-full whitespace-nowrap text-left text-sm">
                    <thead className="bg-gray-50">
                        <tr className="border-b text-gray-500">
                            <th className="p-3 font-medium">Name</th>
                            <th className="p-3 font-medium">Staff ID</th>
                            <th className="p-3 font-medium">Role</th>
                            <th className="p-3 font-medium">Specialty / Level</th>
                            <th className="p-3 font-medium">Office</th>
                            <th className="p-3 font-medium">Phone</th>
                            <th className="p-3 font-medium">Email</th>
                            <th className="p-3 font-medium">Status</th>
                            <th className="p-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={9} className="p-3 text-gray-500">Loading staff...</td></tr>
                        ) : staff.length === 0 ? (
                            <tr><td colSpan={9} className="p-3 text-gray-500">No staff match these filters.</td></tr>
                        ) : (
                            staff.map((s) => (
                                <tr key={s.employeeId} className="border-b last:border-0">
                                    <td className="p-3 font-medium text-gray-900">{s.lastName}, {s.firstName}</td>
                                    <td className="p-3">{formatId(s.employeeId)}</td>
                                    <td className="p-3">{s.role}</td>
                                    <td className="p-3">{s.roleDetail ?? ""}</td>
                                    <td className="p-3">{s.officeName}</td>
                                    <td className="p-3">{s.phone}</td>
                                    <td className="p-3">{s.email}</td>
                                    <td className="p-3"><StatusBadge status={s.isActive ? "Active" : "Inactive"} /></td>
                                    <td className="p-3">
                                        <div className="flex gap-4">
                                            <TextButton onClick={() => setModal({ mode: "edit", staff: s })}>Edit</TextButton>
                                            {s.employeeId !== user?.id && (
                                                <TextButton danger={s.isActive} onClick={() => toggleStatus(s)}>
                                                    {s.isActive ? "Deactivate" : "Activate"}
                                                </TextButton>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {modal?.mode === "add" && (
                <AddStaffModal options={options} onClose={() => setModal(null)} onSaved={() => setReloadCount((c) => c + 1)} />
            )}
            {modal?.mode === "edit" && (
                <EditStaffModal
                    staff={modal.staff}
                    options={options}
                    onClose={() => setModal(null)}
                    onSaved={() => setReloadCount((c) => c + 1)}
                />
            )}
        </div>
    );
}

interface ModalProps {
    options: StaffOptions;
    onClose: () => void;
    onSaved: () => void;
}

const EMPTY_STAFF = {
    firstName: "",
    lastName: "",
    dob: "",
    phone: "",
    email: "",
    employeeTypeId: "",
    officeId: "",
    password: "",
    specialtyId: "",
    nursingLevel: "RN",
    licenseNumber: "",
    licenseState: "TX",
    licenseExpiration: "",
    npiNumber: "",
    deaNumber: "",
};

function AddStaffModal({ options, onClose, onSaved }: ModalProps) {
    const [form, setForm] = useState(EMPTY_STAFF);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [created, setCreated] = useState<{ employeeId: number; firstName: string; lastName: string } | null>(null);

    const roleName = options.roles.find((r) => String(r.employeeTypeId) === form.employeeTypeId)?.name;
    const set = (field: keyof typeof EMPTY_STAFF) => (e: { target: { value: string } }) =>
        setForm({ ...form, [field]: e.target.value });

    // create account
    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setSaving(true);
        try {
            const license = {
                licenseNumber: form.licenseNumber,
                licenseState: form.licenseState,
                licenseExpiration: form.licenseExpiration,
            };
            const res = await api.post("/api/admin/staff", {
                firstName: form.firstName,
                lastName: form.lastName,
                dob: form.dob,
                phone: form.phone,
                email: form.email,
                employeeTypeId: Number(form.employeeTypeId),
                officeId: Number(form.officeId),
                password: form.password,
                doctor: roleName === "Doctor"
                    ? { ...license, npiNumber: form.npiNumber, deaNumber: form.deaNumber || null, specialtyId: Number(form.specialtyId) }
                    : null,
                nurse: roleName === "Nurse" ? { ...license, nursingLevel: form.nursingLevel } : null,
            });
            setCreated(res.data);
            onSaved();
        } catch (err) {
            setError(apiErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    if (created) {
        return (
            <Modal title="Employee Added" onClose={onClose}>
                <div className="space-y-4 text-center">
                    <p className="text-gray-600">{created.firstName} {created.lastName}'s staff ID is</p>
                    <p className="text-4xl font-bold text-blue-600">{formatId(created.employeeId)}</p>
                    <p className="text-sm text-gray-500">They log in with this staff ID and the password you set.</p>
                    <PrimaryButton type="button" onClick={onClose}>Done</PrimaryButton>
                </div>
            </Modal>
        );
    }

    return (
        <Modal title="Add Employee" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="First Name" required value={form.firstName} onChange={set("firstName")} />
                    <Field label="Last Name" required value={form.lastName} onChange={set("lastName")} />
                    <Field label="Date of Birth" type="date" required value={form.dob} onChange={set("dob")} />
                    <Field label="Phone Number" type="tel" required value={form.phone} onChange={set("phone")} />
                    <Field label="Work Email" type="email" required placeholder="firstlast@lambda.clinic.org" value={form.email} onChange={set("email")} />
                    <Field label="Temporary Password" type="text" required minLength={8} value={form.password} onChange={set("password")} />
                    <SelectField label="Role" required value={form.employeeTypeId} onChange={set("employeeTypeId")}>
                        <option value="">Select a role</option>
                        {options.roles.map((r) => <option key={r.employeeTypeId} value={r.employeeTypeId}>{r.name}</option>)}
                    </SelectField>
                    <SelectField label="Office" required value={form.officeId} onChange={set("officeId")}>
                        <option value="">Select an office</option>
                        {options.offices.map((o) => <option key={o.officeId} value={o.officeId}>{o.name}</option>)}
                    </SelectField>
                </div>

                {(roleName === "Doctor" || roleName === "Nurse") && (
                    <div className="space-y-4 rounded-lg bg-gray-50 p-4">
                        <h3 className="font-medium text-gray-900">{roleName === "Doctor" ? "Medical License" : "Nursing License"}</h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {roleName === "Doctor" ? (
                                <SelectField label="Specialty" required value={form.specialtyId} onChange={set("specialtyId")}>
                                    <option value="">Select a specialty</option>
                                    {options.specialties.map((s) => <option key={s.specialtyId} value={s.specialtyId}>{s.name}</option>)}
                                </SelectField>
                            ) : (
                                <SelectField label="Nursing Level" required value={form.nursingLevel} onChange={set("nursingLevel")}>
                                    {NURSING_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                                </SelectField>
                            )}
                            <Field label="License Number" required value={form.licenseNumber} onChange={set("licenseNumber")} />
                            <Field label="Issuing State" required maxLength={2} value={form.licenseState} onChange={set("licenseState")} />
                            <Field label="License Expiration" type="date" required value={form.licenseExpiration} onChange={set("licenseExpiration")} />
                            {roleName === "Doctor" && (
                                <>
                                    <Field label="NPI Number" required inputMode="numeric" maxLength={10} placeholder="10 digits" value={form.npiNumber} onChange={set("npiNumber")} />
                                    <Field label="DEA Number (optional)" value={form.deaNumber} onChange={set("deaNumber")} />
                                </>
                            )}
                        </div>
                    </div>
                )}

                <ErrorText message={error} />
                <FormActions saving={saving} onCancel={onClose} saveLabel="Add Employee" />
            </form>
        </Modal>
    );
}

function EditStaffModal({ staff, options, onClose, onSaved }: ModalProps & { staff: StaffMember }) {
    const [form, setForm] = useState({
        firstName: staff.firstName,
        lastName: staff.lastName,
        phone: staff.phone,
        email: staff.email,
        officeId: String(staff.officeId),
    });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const set = (field: keyof typeof form) => (e: { target: { value: string } }) =>
        setForm({ ...form, [field]: e.target.value });

    // save changes
    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setSaving(true);
        try {
            await api.put(`/api/admin/staff/${staff.employeeId}`, { ...form, officeId: Number(form.officeId) });
            onSaved();
            onClose();
        } catch (err) {
            setError(apiErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal title={`Edit ${staff.firstName} ${staff.lastName}`} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Staff ID" value={formatId(staff.employeeId)} disabled />
                    <Field label="Role" value={staff.roleDetail ? `${staff.role} (${staff.roleDetail})` : staff.role} disabled />
                    <Field label="First Name" required value={form.firstName} onChange={set("firstName")} />
                    <Field label="Last Name" required value={form.lastName} onChange={set("lastName")} />
                    <Field label="Phone Number" type="tel" required value={form.phone} onChange={set("phone")} />
                    <Field label="Work Email" type="email" required value={form.email} onChange={set("email")} />
                    <SelectField label="Office" required value={form.officeId} onChange={set("officeId")}>
                        {options.offices.map((o) => <option key={o.officeId} value={o.officeId}>{o.name}</option>)}
                    </SelectField>
                </div>
                <ErrorText message={error} />
                <FormActions saving={saving} onCancel={onClose} />
            </form>
        </Modal>
    );
}
