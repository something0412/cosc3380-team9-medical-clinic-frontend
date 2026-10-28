import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { AdminPage } from "../../components/admin/AdminPage";
import { ErrorText, PasswordField, SelectField } from "../../components/FormControls";
import { PageError } from "../../components/PortalPage";
import { FormActions, Section, SecondaryButton, SuccessText } from "../../components/ProfileUI";
import { formatId } from "../../utils/id";

interface PatientInfo {
  patientId: number;
  firstName: string;
  lastName: string;
  primaryDoctorId: number | null;
  username: string | null;
  hasLogin: boolean;
}

interface Doctor {
  doctorId: number;
  firstName: string;
  lastName: string;
  specialties: { name: string }[];
}

const BACK = { to: "/admin/patients", label: "Back to Patients" };

// a random 12 character password, without letters that look alike (l, 1, O, 0)
function randomPassword() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  const numbers = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(numbers, (n) => letters[n % letters.length]).join("");
}

// admin edits a patient's primary doctor and password
export function AdminPatientEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  // load the patient and the doctors
  useEffect(() => {
    async function loadPatient() {
      try {
        const patientRes = await api.get<PatientInfo>(`/api/admin/patients/${id}`);
        setPatient(patientRes.data);
        setDoctorId(patientRes.data.primaryDoctorId ? String(patientRes.data.primaryDoctorId) : "");
        const doctorsRes = await api.get<Doctor[]>("/api/public/doctors");
        setDoctors(doctorsRes.data);
      } catch (err) {
        setLoadError(apiErrorMessage(err));
      }
    }
    loadPatient();
  }, [id]);

  // fill both password boxes with a random password
  function generatePassword() {
    const password = randomPassword();
    setNewPassword(password);
    setConfirmPassword(password);
  }

  // save the primary doctor, and the new password if one was typed
  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword && newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/api/admin/patients/${id}`, {
        doctorId: doctorId ? Number(doctorId) : null,
        newPassword: newPassword || null,
      });
      setSuccess(
        newPassword
          ? `Saved. The patient's new password is ${newPassword}. Give it to them so they can sign in.`
          : "Saved."
      );
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!patient) {
    return (
      <AdminPage title="Edit Patient" back={BACK}>
        {loadError ? <PageError message={loadError} /> : <p className="text-sm text-slate-600">Loading patient...</p>}
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title={`Edit ${patient.firstName} ${patient.lastName}`}
      description={`Patient ID ${formatId(patient.patientId)}. Change the primary doctor or set a new password for the patient.`}
      back={BACK}
    >
      <form onSubmit={handleSave} className="space-y-6">
        <Section title="Primary Doctor">
          <div className="max-w-md">
            <SelectField label="Primary doctor" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              <option value="">No primary doctor</option>
              {doctors.map((d) => (
                <option key={d.doctorId} value={d.doctorId}>
                  Dr. {d.firstName} {d.lastName}
                  {d.specialties.length > 0 && ` (${d.specialties.map((s) => s.name).join(", ")})`}
                </option>
              ))}
            </SelectField>
          </div>
        </Section>

        <Section title="New Password">
          {patient.hasLogin ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                For a patient who forgot their password. The current password isn't needed. Leave these empty to keep it.
                {patient.username && ` Login: ${patient.username}`}
              </p>
              <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
                <PasswordField
                  label="New password"
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <PasswordField
                  label="Confirm new password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <SecondaryButton onClick={generatePassword}>Generate random password</SecondaryButton>
            </div>
          ) : (
            <p className="text-sm text-slate-500">This patient doesn't have a portal login yet, so there's no password to change.</p>
          )}
        </Section>

        <ErrorText message={error} />
        <SuccessText message={success} />
        <FormActions saving={saving} onCancel={() => navigate("/admin/patients")} />
      </form>
    </AdminPage>
  );
}
