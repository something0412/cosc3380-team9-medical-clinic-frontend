import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { api, apiErrorMessage } from "../../api";
import { ADMIN_PRIMARY_BUTTON } from "../../components/admin/styles";
import { ErrorText, Field, PhoneField, SelectField } from "../../components/FormControls";
import { Modal } from "../../components/Modal";
import { PageError, PortalPage } from "../../components/PortalPage";
import { FormActions, StatusBadge, WarningBox } from "../../components/ProfileUI";
import { formatId } from "../../utils/id";

interface Patient {
  patientId: number;
  firstName: string;
  lastName: string;
  dob: string;
  isActive: boolean;
}

export function ReceptionistPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  // load all patients
  useEffect(() => {
    async function loadPatients() {
      try {
        const res = await api.get<Patient[]>("/api/patients");
        setPatients(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, []);

  // filter by name, date of birth or patient number
  const searchText = search.trim().toLowerCase();
  const shown = patients.filter(
    (p) =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchText) ||
      p.dob.includes(searchText) ||
      formatId(p.patientId).includes(searchText)
  );

  return (
    <PortalPage
      eyebrow="Front Desk"
      title="Patients"
      description="Find a patient or register a new one."
      actions={
        <button type="button" onClick={() => setShowForm(true)} className={ADMIN_PRIMARY_BUTTON}>
          Register Patient
        </button>
      }
    >
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <Field
          label="Search"
          type="search"
          placeholder="Name, date of birth or patient number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <PageError message={error} />

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3 text-sm text-slate-600">
          {loading ? "Loading patients..." : `Showing ${shown.length} of ${patients.length} patients`}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Patient ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Date of Birth</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && shown.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    {search ? `No patients match "${search}".` : "No patients yet."}
                  </td>
                </tr>
              )}
              {shown.map((p) => (
                <tr key={p.patientId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-slate-500">{formatId(p.patientId)}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-navy">{p.lastName}, {p.firstName}</td>
                  <td className="px-4 py-3 text-slate-700">{p.dob}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.isActive ? "Active" : "Inactive"} /></td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/staff/reception/patients/${p.patientId}`}
                      className="whitespace-nowrap font-medium text-navy hover:text-teal-700 hover:underline"
                    >
                      View details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showForm && <RegisterModal onClose={() => setShowForm(false)} />}
    </PortalPage>
  );
}

function RegisterModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [matches, setMatches] = useState<Patient[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // register the patient and open their page
  // a 409 means someone with this name and birthday exists, so the receptionist checks before confirming
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await api.post<{ patientId: number }>("/api/patients", {
        firstName,
        lastName,
        dob,
        gender,
        phone,
        email,
        address,
        confirmedNewPatient: matches.length > 0,
      });
      navigate(`/staff/reception/patients/${res.data.patientId}`);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409 && err.response.data?.matches) {
        setMatches(err.response.data.matches);
      }
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Register Patient" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First Name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <Field label="Last Name" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <Field label="Date of Birth" type="date" required value={dob} onChange={(e) => setDob(e.target.value)} />
          <SelectField label="Gender" value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Not given</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </SelectField>
          <PhoneField label="Phone" value={phone} onChange={setPhone} />
          <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Field label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />

        {matches.length > 0 && (
          <WarningBox>
            <p className="font-medium">Possible existing patient:</p>
            <ul className="mt-2 space-y-1">
              {matches.map((m) => (
                <li key={m.patientId}>
                  <Link to={`/staff/reception/patients/${m.patientId}`} className="font-medium text-navy hover:underline">
                    {m.firstName} {m.lastName}
                  </Link>{" "}
                  · born {m.dob} · ID {formatId(m.patientId)}
                </li>
              ))}
            </ul>
            <p className="mt-2">If this is a different person, press Register again to add them.</p>
          </WarningBox>
        )}

        <ErrorText message={matches.length > 0 ? "" : error} />
        <FormActions saving={saving} onCancel={onClose} saveLabel={matches.length > 0 ? "Register Anyway" : "Register"} />
      </form>
    </Modal>
  );
}
