import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { ErrorText, Field, SelectField } from "../../components/FormControls";
import { Modal } from "../../components/Modal";
import { PageError, PortalPage } from "../../components/PortalPage";
import { DangerButton, FormActions, InfoGrid, InfoItem, SecondaryButton, Section, StatusBadge, SuccessText, TextButton } from "../../components/ProfileUI";
import { formatId } from "../../utils/id";

interface PatientInfo {
  patientId: number;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  isActive: boolean;
  hasLogin: boolean;
  insurance: { provider: string; policyNumber: string; status: string } | null;
  emergencyContacts: { emergencyContactId: number; firstName: string; lastName: string; relationship: string; phoneNumber: string; isPrimary: boolean }[];
  forms: { formTypeId: number; name: string; isRequired: boolean; completed: boolean; completedDate: string | null }[];
  appointments: { appointmentId: number; date: string; startTime: string; doctorName: string; specialty: string; officeName: string; status: string }[];
  balance: string;
}

const BACK = { to: "/staff/reception/patients", label: "Back to patients" };

export function ReceptionistPatientDetail() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const [openForm, setOpenForm] = useState("");
  const [saving, setSaving] = useState(false);

  // load the patient
  useEffect(() => {
    async function loadPatient() {
      try {
        const res = await api.get<PatientInfo>(`/api/receptionist/patients/${patientId}`);
        setPatient(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    loadPatient();
  }, [patientId, reloadCount]);

  // reload after a change and show what happened
  function handleSaved(text: string) {
    setMessage(text);
    setError("");
    setReloadCount(reloadCount + 1);
  }

  // verify or deny the insurance (sends back the policy that was checked)
  async function setInsuranceStatus(status: string) {
    if (!patient?.insurance) return;
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await api.patch(`/api/receptionist/patients/${patientId}/insurance/status`, {
        status,
        provider: patient.insurance.provider,
        policyNumber: patient.insurance.policyNumber,
      });
      handleSaved(`Insurance marked ${status}.`);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // mark a paper form as completed
  async function completeForm(formTypeId: number, name: string) {
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await api.post(`/api/receptionist/patients/${patientId}/forms/${formTypeId}/complete`);
      handleSaved(`${name} marked completed.`);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!patient) {
    return (
      <PortalPage eyebrow="Front Desk" title="Patient" back={BACK}>
        {error ? <PageError message={error} /> : <p className="text-slate-500">Loading patient...</p>}
      </PortalPage>
    );
  }

  const missingForms = patient.forms.filter((f) => f.isRequired && !f.completed);
  const balance = Number(patient.balance);

  return (
    <PortalPage
      eyebrow="Front Desk"
      title={`${patient.firstName} ${patient.lastName}`}
      description={`Patient ID ${formatId(patient.patientId)} · Born ${patient.dob} · ${patient.hasLogin ? "Has a portal login" : "No portal login"}`}
      back={BACK}
      actions={
        <div className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Balance Owed</p>
          <p className={`text-2xl font-bold ${balance > 0 ? "text-red-600" : "text-navy"}`}>${balance.toFixed(2)}</p>
        </div>
      }
    >
      {!patient.isActive && <StatusBadge status="Inactive" />}
      <PageError message={error} />
      <SuccessText message={message} />

      {missingForms.length > 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Missing required forms: {missingForms.map((f) => f.name).join(", ")}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Contact Info" action={<TextButton onClick={() => setOpenForm("contact")}>Edit</TextButton>}>
          <InfoGrid>
            <InfoItem label="Phone" value={patient.phone} />
            <InfoItem label="Email" value={patient.email} />
            <InfoItem label="Gender" value={patient.gender} />
            <InfoItem label="Address" value={patient.address} />
          </InfoGrid>
          {!patient.hasLogin && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <SecondaryButton onClick={() => setOpenForm("login")}>Set Up Portal Login</SecondaryButton>
            </div>
          )}
        </Section>

        <Section
          title="Insurance"
          action={<TextButton onClick={() => setOpenForm("insurance")}>{patient.insurance ? "Change" : "Add"}</TextButton>}
        >
          {patient.insurance ? (
            <div className="space-y-4">
              <InfoGrid>
                <InfoItem label="Provider" value={patient.insurance.provider} />
                <InfoItem label="Policy Number" value={patient.insurance.policyNumber} />
                <InfoItem label="Status" value={<StatusBadge status={patient.insurance.status} />} />
              </InfoGrid>
              {patient.insurance.status !== "Verified" && (
                <div className="flex gap-2">
                  <SecondaryButton disabled={saving} onClick={() => setInsuranceStatus("Verified")}>Verify</SecondaryButton>
                  {patient.insurance.status !== "Denied" && (
                    <DangerButton disabled={saving} onClick={() => setInsuranceStatus("Denied")}>Deny</DangerButton>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-500">No insurance on file.</p>
          )}
        </Section>

        <Section title="Emergency Contacts" action={<TextButton onClick={() => setOpenForm("contactPerson")}>Add</TextButton>}>
          {patient.emergencyContacts.length === 0 ? (
            <p className="text-slate-500">No emergency contacts.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {patient.emergencyContacts.map((c) => (
                <li key={c.emergencyContactId} className="flex justify-between py-2 text-sm">
                  <span>
                    <span className="font-medium text-slate-900">{c.firstName} {c.lastName}</span> · {c.relationship}
                    {c.isPrimary && <span className="ml-2"><StatusBadge status="Primary" /></span>}
                  </span>
                  <span className="text-slate-600">{c.phoneNumber}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Forms">
          <ul className="divide-y divide-slate-100">
            {patient.forms.map((f) => (
              <li key={f.formTypeId} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <span className="font-medium text-slate-900">{f.name}</span>
                  {f.isRequired && <span className="ml-2 text-xs text-slate-500">Required</span>}
                </span>
                {f.completed ? (
                  <span className="text-green-700">Completed {f.completedDate}</span>
                ) : (
                  <TextButton disabled={saving} onClick={() => completeForm(f.formTypeId, f.name)}>Mark Completed</TextButton>
                )}
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section
        title="Recent Appointments"
        action={<Link to="/staff/reception/appointments" className="text-sm font-medium text-navy hover:text-teal-700 hover:underline">Book appointment</Link>}
      >
        {patient.appointments.length === 0 ? (
          <p className="text-slate-500">No appointments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Doctor</th>
                  <th className="px-4 py-3">Specialty</th>
                  <th className="px-4 py-3">Office</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patient.appointments.map((a) => (
                  <tr key={a.appointmentId} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">{a.date}</td>
                    <td className="px-4 py-3 text-slate-700">{a.startTime}</td>
                    <td className="px-4 py-3 text-slate-700">Dr. {a.doctorName}</td>
                    <td className="px-4 py-3 text-slate-700">{a.specialty}</td>
                    <td className="px-4 py-3 text-slate-700">{a.officeName}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {openForm === "contact" && (
        <ContactModal patient={patient} onClose={() => setOpenForm("")} onSaved={() => handleSaved("Contact info saved.")} />
      )}
      {openForm === "insurance" && (
        <InsuranceModal patient={patient} onClose={() => setOpenForm("")} onSaved={() => handleSaved("Insurance saved. It needs to be verified.")} />
      )}
      {openForm === "contactPerson" && (
        <EmergencyContactModal patientId={patient.patientId} onClose={() => setOpenForm("")} onSaved={() => handleSaved("Emergency contact added.")} />
      )}
      {openForm === "login" && (
        <PortalLoginModal patient={patient} onClose={() => setOpenForm("")} onSaved={() => handleSaved("Portal login created.")} />
      )}
    </PortalPage>
  );
}

function ContactModal({ patient, onClose, onSaved }: { patient: PatientInfo; onClose: () => void; onSaved: () => void }) {
  const [phone, setPhone] = useState(patient.phone);
  const [address, setAddress] = useState(patient.address ?? "");
  const [gender, setGender] = useState(patient.gender ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // save contact info
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.patch(`/api/receptionist/patients/${patient.patientId}`, { phone, address, gender });
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Edit Contact Info" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Phone" required value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Field label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <SelectField label="Gender" value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">Not given</option>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
          <option value="Other">Other</option>
        </SelectField>
        <p className="text-sm text-slate-500">Email is the patient's login, so only the patient can change it.</p>
        <ErrorText message={error} />
        <FormActions saving={saving} onCancel={onClose} />
      </form>
    </Modal>
  );
}

function InsuranceModal({ patient, onClose, onSaved }: { patient: PatientInfo; onClose: () => void; onSaved: () => void }) {
  const [provider, setProvider] = useState(patient.insurance?.provider ?? "");
  const [policyNumber, setPolicyNumber] = useState(patient.insurance?.policyNumber ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // save insurance
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.put(`/api/receptionist/patients/${patient.patientId}/insurance`, { provider, policyNumber });
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={patient.insurance ? "Change Insurance" : "Add Insurance"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Provider" required value={provider} onChange={(e) => setProvider(e.target.value)} />
        <Field label="Policy Number" required value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} />
        <p className="text-sm text-slate-500">Saving sets the insurance back to Pending until it is verified.</p>
        <ErrorText message={error} />
        <FormActions saving={saving} onCancel={onClose} />
      </form>
    </Modal>
  );
}

function EmergencyContactModal({ patientId, onClose, onSaved }: { patientId: number; onClose: () => void; onSaved: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // add the contact
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post(`/api/receptionist/patients/${patientId}/emergency-contacts`, { firstName, lastName, relationship, phoneNumber, isPrimary });
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Add Emergency Contact" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First Name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <Field label="Last Name" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <Field label="Relationship" required value={relationship} onChange={(e) => setRelationship(e.target.value)} />
          <Field label="Phone" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
          Primary contact
        </label>
        <ErrorText message={error} />
        <FormActions saving={saving} onCancel={onClose} saveLabel="Add Contact" />
      </form>
    </Modal>
  );
}

function PortalLoginModal({ patient, onClose, onSaved }: { patient: PatientInfo; onClose: () => void; onSaved: () => void }) {
  const [email, setEmail] = useState(patient.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // create the login after checking the patient's photo ID
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post(`/api/receptionist/patients/${patient.patientId}/login`, { email, password });
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Set Up Portal Login" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">Check the patient's photo ID first. The patient signs in with this email and password.</p>
        <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Temporary Password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        <ErrorText message={error} />
        <FormActions saving={saving} onCancel={onClose} saveLabel="Create Login" />
      </form>
    </Modal>
  );
}
