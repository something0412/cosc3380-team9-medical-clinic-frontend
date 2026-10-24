import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { ErrorText, Field, SelectField } from "../../components/FormControls";
import { Modal } from "../../components/Modal";
import { FormActions, PrimaryButton } from "../../components/ProfileUI";
import { formatId } from "../../utils/id";

interface Patient {
  patientId: number;
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;
  email: string | null;
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

  // filter by name, phone or patient number
  const searchText = search.trim().toLowerCase();
  const shown = patients.filter(
    (p) =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchText) ||
      p.phone.includes(searchText) ||
      formatId(p.patientId).includes(searchText)
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="mt-1 text-gray-600">Find or register patients.</p>
        </div>
        <PrimaryButton type="button" onClick={() => setShowForm(true)}>+ Register Patient</PrimaryButton>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, phone or patient number"
        className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
      />

      {error && <p className="text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full whitespace-nowrap text-left text-sm">
          <thead className="bg-gray-50">
            <tr className="border-b text-gray-500">
              <th className="p-3 font-medium">Patient #</th>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Date of Birth</th>
              <th className="p-3 font-medium">Phone</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-3 text-gray-500">Loading patients...</td></tr>
            ) : shown.length === 0 ? (
              <tr><td colSpan={6} className="p-3 text-gray-500">{search ? `No patients match "${search}".` : "No patients yet."}</td></tr>
            ) : (
              shown.map((p) => (
                <tr key={p.patientId} className="border-b last:border-0">
                  <td className="p-3">{formatId(p.patientId)}</td>
                  <td className="p-3">
                    <Link to={`/staff/reception/patients/${p.patientId}`} className="font-medium text-blue-600 hover:underline">
                      {p.lastName}, {p.firstName}
                    </Link>
                    {!p.isActive && <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700">Inactive</span>}
                  </td>
                  <td className="p-3">{p.dob.slice(0, 10)}</td>
                  <td className="p-3">{p.phone}</td>
                  <td className="p-3">{p.email ?? "—"}</td>
                  <td className="p-3">
                    <Link to={`/staff/reception/patients/${p.patientId}`} className="text-blue-600 hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && <RegisterModal onClose={() => setShowForm(false)} />}
    </div>
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
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // register the patient and open their page
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await api.post<{ patientId: number }>("/api/patients", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dob,
        gender,
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
      });
      navigate(`/staff/reception/patients/${res.data.patientId}`);
    } catch (err) {
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
          <Field label="Phone" required value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Field label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <ErrorText message={error} />
        <FormActions saving={saving} onCancel={onClose} saveLabel="Register" />
      </form>
    </Modal>
  );
}
