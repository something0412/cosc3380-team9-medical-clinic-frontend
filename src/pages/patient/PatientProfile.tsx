import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, apiErrorMessage } from "../../api";
import { ErrorText, Field, PhoneField, SelectField } from "../../components/FormControls";
import { PageError, PortalPage } from "../../components/PortalPage";
import {
    ChangePasswordForm,
    FormActions,
    InfoGrid,
    InfoItem,
    SecondaryButton,
    Section,
    StatusText,
    SuccessText,
    TextButton,
} from "../../components/ProfileUI";
import { useAuth } from "../../context/AuthContext";
import type { EmergencyContact, EmergencyContactInput, PatientProfile as Profile } from "../../types";
import { formatId } from "../../utils/id";

const GENDERS = ["Female", "Male", "Non-binary", "Other", "Prefer not to say"];

export function PatientProfile() {
    const { user } = useAuth();
    const patientId = user?.role === "patient" ? user.id : null;
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloadCount, setReloadCount] = useState(0);

    useEffect(() => {
        let active = true;

        async function loadProfile() {
            setError("");

            if (patientId === null || !Number.isSafeInteger(patientId) || patientId <= 0) {
                setError("Patient information was not found. Please log in again.");
                setLoading(false);
                return;
            }

            try {
                const res = await api.get<Profile>(`/api/patient/${patientId}/profile`);
                if (active) setProfile(res.data);
            } catch (err) {
                if (active) setError(apiErrorMessage(err));
            } finally {
                if (active) setLoading(false);
            }
        }

        loadProfile();
        return () => {
            active = false;
        };
    }, [patientId, reloadCount]);

    const reload = async () => setReloadCount((c) => c + 1);

    return (
        <PortalPage eyebrow="Patient Portal" title="My Profile" description="View and update your personal information.">
            {loading && <p className="text-slate-500">Loading profile...</p>}
            <PageError message={error} />

            {profile && (
                <>
                    <Section title="Personal Information">
                        <InfoGrid>
                            <InfoItem label="Patient Number" value={formatId(profile.patientId)} />
                            <InfoItem label="Account Status" value={profile.isActive ? "Active" : "Inactive"} />
                            <InfoItem label="First Name" value={profile.firstName} />
                            <InfoItem label="Last Name" value={profile.lastName} />
                            <InfoItem label="Date of Birth" value={profile.dob} />
                        </InfoGrid>
                        <p className="mt-4 text-sm text-slate-500">
                            To change your name or date of birth, please contact the front desk.
                        </p>
                    </Section>

                    <Section title="Primary Doctor">
                        {profile.primaryDoctor ? (
                            <p className="text-sm text-slate-900">
                                <span className="font-medium">Dr. {profile.primaryDoctor.name}</span>
                            </p>
                        ) : (
                            <p className="text-sm text-slate-500">
                                You'll be assigned a primary doctor after you finish your first Family Medicine appointment.
                            </p>
                        )}
                        <p className="mt-2 text-sm text-slate-500">To change your primary doctor, please contact the clinic.</p>
                    </Section>

                    <ContactInfoSection profile={profile} onSaved={reload} />
                    <EmergencyContactsSection profile={profile} onSaved={reload} />
                    <InsuranceSection profile={profile} onSaved={reload} />
                    <ChangePasswordForm onSubmit={(body) => api.put(`/api/patient/${patientId}/password`, body)} />
                </>
            )}
        </PortalPage>
    );
}

interface SectionProps {
    profile: Profile;
    onSaved: () => Promise<void>;
}

function ContactInfoSection({ profile, onSaved }: SectionProps) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ phone: "", email: "", address: "", gender: "" });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [saving, setSaving] = useState(false);

    function startEdit() {
        setForm({
            phone: profile.phone,
            email: profile.email ?? "",
            address: profile.address ?? "",
            gender: profile.gender ?? "",
        });
        setError("");
        setSuccess("");
        setEditing(true);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setSaving(true);
        try {
            await api.put(`/api/patient/${profile.patientId}/profile`, {
                phone: form.phone,
                email: form.email,
                address: form.address || null,
                gender: form.gender || null,
            });
            await onSaved();
            setEditing(false);
            setSuccess("Contact information updated.");
        } catch (err) {
            setError(apiErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    const set = (field: keyof typeof form) => (e: { target: { value: string } }) =>
        setForm({ ...form, [field]: e.target.value });

    return (
        <Section title="Contact Information" action={!editing && <SecondaryButton onClick={startEdit}>Edit</SecondaryButton>}>
            {editing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <PhoneField label="Phone Number" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
                        <Field label="Email Address" type="email" required value={form.email} onChange={set("email")} />
                        <Field label="Address" value={form.address} onChange={set("address")} />
                        <SelectField label="Gender" value={form.gender} onChange={set("gender")}>
                            <option value="">Not provided</option>
                            {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                        </SelectField>
                    </div>
                    <p className="text-sm text-slate-500">Your email is also the email you use to log in.</p>
                    <ErrorText message={error} />
                    <FormActions saving={saving} onCancel={() => setEditing(false)} />
                </form>
            ) : (
                <>
                    <InfoGrid>
                        <InfoItem label="Phone Number" value={profile.phone} />
                        <InfoItem label="Email Address" value={profile.email} />
                        <InfoItem label="Address" value={profile.address} />
                        <InfoItem label="Gender" value={profile.gender} />
                    </InfoGrid>
                    <div className="mt-4"><SuccessText message={success} /></div>
                </>
            )}
        </Section>
    );
}

const EMPTY_CONTACT: EmergencyContactInput = {
    firstName: "",
    lastName: "",
    relationship: "",
    phoneNumber: "",
    isPrimary: false,
};

function EmergencyContactsSection({ profile, onSaved }: SectionProps) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState(EMPTY_CONTACT);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    function openForm(contact?: EmergencyContact) {
        setForm(contact ? { ...contact } : { ...EMPTY_CONTACT, isPrimary: profile.emergencyContacts.length === 0 });
        setEditingId(contact?.emergencyContactId ?? 0);
        setError("");
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setSaving(true);
        try {
            const body = {
                firstName: form.firstName,
                lastName: form.lastName,
                relationship: form.relationship,
                phoneNumber: form.phoneNumber,
                isPrimary: form.isPrimary,
            };
            if (editingId) {
                await api.put(`/api/patient/${profile.patientId}/emergency-contacts/${editingId}`, body);
            } else {
                await api.post(`/api/patient/${profile.patientId}/emergency-contacts`, body);
            }
            await onSaved();
            setEditingId(null);
        } catch (err) {
            setError(apiErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    async function handleRemove(contact: EmergencyContact) {
        if (!window.confirm(`Remove ${contact.firstName} ${contact.lastName} from your emergency contacts?`)) return;
        try {
            await api.delete(`/api/patient/${profile.patientId}/emergency-contacts/${contact.emergencyContactId}`);
            await onSaved();
        } catch (err) {
            setError(apiErrorMessage(err));
        }
    }

    const set = (field: "firstName" | "lastName" | "relationship") =>
        (e: { target: { value: string } }) => setForm({ ...form, [field]: e.target.value });

    return (
        <Section
            title="Emergency Contacts"
            action={editingId === null && <SecondaryButton onClick={() => openForm()}>Add Contact</SecondaryButton>}
        >
            {profile.emergencyContacts.length === 0 && editingId === null && (
                <p className="text-slate-500">No emergency contacts yet.</p>
            )}

            <ul className="space-y-3">
                {profile.emergencyContacts.map((c) => (
                    <li key={c.emergencyContactId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4">
                        <div>
                            <p className="font-medium text-slate-900">
                                {c.firstName} {c.lastName}
                                {c.isPrimary && <span className="ml-2"><StatusText status="Primary" /></span>}
                            </p>
                            <p className="text-sm text-slate-600">{c.relationship} · {c.phoneNumber}</p>
                        </div>
                        {editingId === null && (
                            <div className="flex gap-4">
                                <TextButton onClick={() => openForm(c)}>Edit</TextButton>
                                <TextButton danger onClick={() => handleRemove(c)}>Remove</TextButton>
                            </div>
                        )}
                    </li>
                ))}
            </ul>

            {editingId !== null && (
                <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-lg bg-slate-50 p-4">
                    <h4 className="font-medium text-slate-900">{editingId ? "Edit Contact" : "New Contact"}</h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field label="First Name" required value={form.firstName} onChange={set("firstName")} />
                        <Field label="Last Name" required value={form.lastName} onChange={set("lastName")} />
                        <Field label="Relationship" required placeholder="e.g. Spouse, Parent" value={form.relationship} onChange={set("relationship")} />
                        <PhoneField label="Phone Number" value={form.phoneNumber} onChange={(phoneNumber) => setForm({ ...form, phoneNumber })} />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={form.isPrimary} onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })} />
                        Primary contact
                    </label>
                    <ErrorText message={error} />
                    <FormActions saving={saving} onCancel={() => setEditingId(null)} />
                </form>
            )}

            {editingId === null && <div className="mt-3"><ErrorText message={error} /></div>}
        </Section>
    );
}

function InsuranceSection({ profile, onSaved }: SectionProps) {
    const [editing, setEditing] = useState(false);
    const [provider, setProvider] = useState("");
    const [policyNumber, setPolicyNumber] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const insurance = profile.insurance;

    function startEdit() {
        setProvider(insurance?.provider ?? "");
        setPolicyNumber(insurance?.policyNumber ?? "");
        setError("");
        setEditing(true);
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setSaving(true);
        try {
            await api.put(`/api/patient/${profile.patientId}/insurance`, { provider, policyNumber });
            await onSaved();
            setEditing(false);
        } catch (err) {
            setError(apiErrorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <Section
            title="Insurance"
            action={!editing && <SecondaryButton onClick={startEdit}>{insurance ? "Edit" : "Add Insurance"}</SecondaryButton>}
        >
            {editing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field label="Provider" required value={provider} onChange={(e) => setProvider(e.target.value)} />
                        <Field label="Policy Number" required value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} />
                    </div>
                    <p className="text-sm text-slate-500">Saving will set your insurance to Pending until the front desk verifies it.</p>
                    <ErrorText message={error} />
                    <FormActions saving={saving} onCancel={() => setEditing(false)} />
                </form>
            ) : insurance ? (
                <InfoGrid>
                    <InfoItem label="Provider" value={insurance.provider} />
                    <InfoItem label="Policy Number" value={insurance.policyNumber} />
                    <InfoItem label="Status" value={<StatusText status={insurance.status} />} />
                </InfoGrid>
            ) : (
                <p className="text-slate-500">No insurance on file.</p>
            )}
        </Section>
    );
}
