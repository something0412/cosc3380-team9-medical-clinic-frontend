import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, apiErrorMessage } from "../../api";
import { ErrorText, Field } from "../../components/FormControls";
import {
  ChangePasswordForm,
  FormActions,
  InfoGrid,
  InfoItem,
  Section,
  SecondaryButton,
  StatusBadge,
  SuccessText,
  TextButton,
} from "../../components/ProfileUI";
import { PageError, PortalPage } from "../../components/PortalPage";
import { useAuth } from "../../context/AuthContext";
import type { Certificate, CertificateInput, StaffProfile as Profile } from "../../types";
import { formatId } from "../../utils/id";

// heading label for each employee type
const PORTAL_NAMES: Record<string, string> = {
  Doctor: "Doctor",
  Nurse: "Nursing",
  Receptionist: "Front Desk",
  Administrator: "Administration",
  "Lab Technician": "Laboratory",
};

export function StaffProfile() {
  const { user } = useAuth();
  const employeeId = user?.id ?? 0;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const res = await api.get<Profile>(`/api/staff/${employeeId}/profile`);
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
  }, [employeeId, reloadCount]);

  const reload = async () => setReloadCount((c) => c + 1);

  return (
    <PortalPage
      eyebrow={PORTAL_NAMES[user?.employeeType ?? ""] ?? "Staff"}
      title="My Profile"
      description="View your employee information and manage your certificates and password."
    >
      {loading && <p className="text-slate-500">Loading profile...</p>}
      <PageError message={error} />

      {profile && (
        <>
          <Section title="Employee Information">
            <InfoGrid>
              <InfoItem label="Staff ID" value={formatId(profile.employeeId)} />
              <InfoItem label="Account Status" value={profile.isActive ? "Active" : "Inactive"} />
              <InfoItem label="Name" value={`${profile.firstName} ${profile.lastName}`} />
              <InfoItem label="Role" value={profile.employeeType} />
              <InfoItem label="Office" value={profile.officeName} />
              <InfoItem label="Date of Birth" value={profile.dob} />
            </InfoGrid>
            <p className="mt-4 text-sm text-slate-500">
              Your employee information is managed by the clinic. Contact an administrator to make changes.
            </p>
          </Section>

          <ContactSection profile={profile} onSaved={reload} />

          {profile.doctor && (
            <Section title="Medical License">
              <InfoGrid>
                <InfoItem label="License Number" value={profile.doctor.licenseNumber} />
                <InfoItem label="Issuing State" value={profile.doctor.licenseState} />
                <InfoItem label="License Expiration" value={profile.doctor.licenseExpiration} />
                <InfoItem label="NPI Number" value={profile.doctor.npiNumber} />
                <InfoItem label="DEA Number" value={profile.doctor.deaNumber} />
                <InfoItem
                  label="Specialties"
                  value={profile.doctor.specialties.map((s) => (s.isPrimary ? `${s.name} (primary)` : s.name)).join(", ")}
                />
              </InfoGrid>
            </Section>
          )}

          {profile.doctor && (
            <Section title="Weekly Schedule">
              {profile.doctor.schedule.length === 0 ? (
                <p className="text-slate-500">No schedule assigned yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b text-slate-500">
                        <th className="p-2 font-medium">Day</th>
                        <th className="p-2 font-medium">Shift</th>
                        <th className="p-2 font-medium">Hours</th>
                        <th className="p-2 font-medium">Office</th>
                        <th className="p-2 font-medium">Specialty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.doctor.schedule.map((s) => (
                        <tr key={s.dayOfWeek} className="border-b">
                          <td className="p-2">{s.dayOfWeek}</td>
                          <td className="p-2">{s.shift}</td>
                          <td className="p-2">{s.startTime} – {s.endTime}</td>
                          <td className="p-2">{s.officeName}</td>
                          <td className="p-2">{s.specialty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          )}

          {profile.nurse && (
            <Section title="Nursing License">
              <InfoGrid>
                <InfoItem label="License Number" value={profile.nurse.licenseNumber} />
                <InfoItem label="Nursing Level" value={profile.nurse.nursingLevel} />
                <InfoItem label="Issuing State" value={profile.nurse.licenseState} />
                <InfoItem label="License Expiration" value={profile.nurse.licenseExpiration} />
              </InfoGrid>
            </Section>
          )}

          <CertificatesSection profile={profile} onSaved={reload} />
          <ChangePasswordForm onSubmit={(body) => api.put(`/api/staff/${employeeId}/password`, body)} />
        </>
      )}
    </PortalPage>
  );
}

interface SectionProps {
  profile: Profile;
  onSaved: () => Promise<void>;
}

function ContactSection({ profile, onSaved }: SectionProps) {
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setPhone(profile.phone);
    setError("");
    setSuccess("");
    setEditing(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.put(`/api/staff/${profile.employeeId}/profile`, { phone });
      await onSaved();
      setEditing(false);
      setSuccess("Phone number updated.");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title="Contact Information" action={!editing && <SecondaryButton onClick={startEdit}>Edit</SecondaryButton>}>
      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Work Email" value={profile.email} disabled />
            <Field label="Phone Number" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <p className="text-sm text-slate-500">Your work email is provided by the clinic and can't be changed.</p>
          <ErrorText message={error} />
          <FormActions saving={saving} onCancel={() => setEditing(false)} />
        </form>
      ) : (
        <>
          <InfoGrid>
            <InfoItem label="Work Email" value={profile.email} />
            <InfoItem label="Phone Number" value={profile.phone} />
          </InfoGrid>
          <div className="mt-4"><SuccessText message={success} /></div>
        </>
      )}
    </Section>
  );
}

const EMPTY_CERTIFICATE: CertificateInput = { name: "", issueDate: "", expirationDate: "" };

function CertificatesSection({ profile, onSaved }: SectionProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_CERTIFICATE);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function openForm(cert?: Certificate) {
    setForm(cert ? { name: cert.name, issueDate: cert.issueDate, expirationDate: cert.expirationDate } : EMPTY_CERTIFICATE);
    setEditingId(cert?.certificateId ?? 0);
    setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (form.expirationDate < form.issueDate) {
      setError("Expiration date must be on or after the issue date");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/api/staff/${profile.employeeId}/certificates/${editingId}`, form);
      } else {
        await api.post(`/api/staff/${profile.employeeId}/certificates`, form);
      }
      await onSaved();
      setEditingId(null);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(cert: Certificate) {
    if (!window.confirm(`Remove the "${cert.name}" certificate?`)) return;
    try {
      await api.delete(`/api/staff/${profile.employeeId}/certificates/${cert.certificateId}`);
      await onSaved();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  const set = (field: keyof CertificateInput) => (e: { target: { value: string } }) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <Section
      title="Certificates"
      action={editingId === null && <SecondaryButton onClick={() => openForm()}>Add Certificate</SecondaryButton>}
    >
      {profile.certificates.length === 0 && editingId === null ? (
        <p className="text-slate-500">No certificates on file.</p>
      ) : (
        profile.certificates.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="p-2 font-medium">Certificate</th>
                  <th className="p-2 font-medium">Issued</th>
                  <th className="p-2 font-medium">Expires</th>
                  <th className="p-2 font-medium">Status</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {profile.certificates.map((c) => (
                  <tr key={c.certificateId} className="border-b">
                    <td className="p-2 font-medium text-slate-900">{c.name}</td>
                    <td className="p-2">{c.issueDate}</td>
                    <td className="p-2">{c.expirationDate}</td>
                    <td className="p-2"><StatusBadge status={c.status} /></td>
                    <td className="p-2 text-right">
                      {editingId === null && (
                        <div className="flex justify-end gap-4">
                          <TextButton onClick={() => openForm(c)}>Edit</TextButton>
                          <TextButton danger onClick={() => handleRemove(c)}>Remove</TextButton>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {editingId !== null && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-lg bg-slate-50 p-4">
          <h4 className="font-medium text-slate-900">{editingId ? "Edit Certificate" : "New Certificate"}</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Certificate Name" required placeholder="e.g. BLS, ACLS" value={form.name} onChange={set("name")} />
            <Field label="Issue Date" type="date" required value={form.issueDate} onChange={set("issueDate")} />
            <Field label="Expiration Date" type="date" required value={form.expirationDate} onChange={set("expirationDate")} />
          </div>
          <ErrorText message={error} />
          <FormActions saving={saving} onCancel={() => setEditingId(null)} />
        </form>
      )}

      {editingId === null && <div className="mt-3"><ErrorText message={error} /></div>}
    </Section>
  );
}
