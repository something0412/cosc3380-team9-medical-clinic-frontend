import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../../../context/AuthContext";
import { authErrorMessage } from "../../../services/authApi";
import { registerPatient } from "../../../services/frontDeskApi";
import type { Patient } from "../../../types";

// The registration form's fields, kept flat while typing; turned into the
// nested CreatePatientRequest on submit.
type RegisterForm = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  ecFirstName: string;
  ecLastName: string;
  ecRelationship: string;
  ecPhone: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  portalPassword: string;
};

// Empty registration form. Used to start the form and to clear it after saving.
const EMPTY_PATIENT: RegisterForm = {
  firstName: "",
  lastName: "",
  dob: "",
  gender: "",
  phone: "",
  email: "",
  address: "",
  ecFirstName: "",
  ecLastName: "",
  ecRelationship: "",
  ecPhone: "",
  insuranceProvider: "",
  insurancePolicyNumber: "",
  portalPassword: "",
};

// The text inputs on the registration form. Gender is a dropdown, so it's
// written out separately below. No SSN on purpose: insurance identifies the
// patient, and SSNs are too risky to store.
const REGISTER_FIELDS: {
  field: keyof RegisterForm;
  label: string;
  type?: string;
  required?: boolean;
}[] = [
  { field: "firstName", label: "First name", required: true },
  { field: "lastName", label: "Last name", required: true },
  { field: "dob", label: "Date of birth", type: "date", required: true },
  { field: "phone", label: "Phone", type: "tel", required: true },
  { field: "email", label: "Email", type: "email" },
  { field: "address", label: "Address" },
  { field: "ecFirstName", label: "Emergency contact first name" },
  { field: "ecLastName", label: "Emergency contact last name" },
  { field: "ecRelationship", label: "Emergency contact relationship" },
  { field: "ecPhone", label: "Emergency contact phone", type: "tel" },
  { field: "insuranceProvider", label: "Insurance provider" },
  { field: "insurancePolicyNumber", label: "Insurance policy number" },
  { field: "portalPassword", label: "Portal password (optional, needs email)", type: "password" },
];

// Register a new patient at the front desk. Emergency contact, insurance
// and portal login are optional; the backend saves everything in one
// transaction, so a failure (e.g. duplicate policy number) saves nothing.
export function RegisterPatientForm({ onRegistered }: { onRegistered: (patient: Patient) => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState<RegisterForm>(EMPTY_PATIENT);
  const [message, setMessage] = useState("");

  // Updates one field of the form, e.g. updateField("phone", "713...").
  function updateField(field: keyof RegisterForm, value: string) {
    setForm({ ...form, [field]: value });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const f = form;

    // Emergency contact and insurance are optional, but all-or-nothing.
    const ec = [f.ecFirstName, f.ecLastName, f.ecRelationship, f.ecPhone];
    const ins = [f.insuranceProvider, f.insurancePolicyNumber];
    if (ec.some(Boolean) && !ec.every(Boolean)) {
      setMessage("Fill in all emergency contact fields, or leave them all blank.");
      return;
    }
    if (ins.some(Boolean) && !ins.every(Boolean)) {
      setMessage("Fill in both insurance fields, or leave them both blank.");
      return;
    }
    if (f.portalPassword && !f.email) {
      setMessage("A portal account needs an email address.");
      return;
    }

    try {
      const saved = await registerPatient(user.id, {
        firstName: f.firstName,
        lastName: f.lastName,
        dob: f.dob,
        gender: f.gender,
        phone: f.phone,
        email: f.email,
        address: f.address,
        emergencyContact: ec.every(Boolean)
          ? { firstName: f.ecFirstName, lastName: f.ecLastName, relationship: f.ecRelationship, phone: f.ecPhone }
          : null,
        insurance: ins.every(Boolean) ? { provider: f.insuranceProvider, policyNumber: f.insurancePolicyNumber } : null,
        portalPassword: f.portalPassword || null,
      });
      setForm(EMPTY_PATIENT);
      setMessage("");
      onRegistered(saved);
    } catch (err) {
      setMessage(`Could not register patient: ${authErrorMessage(err)}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
      <h2 className="text-lg font-medium text-gray-900 sm:col-span-2">Register patient</h2>
      {REGISTER_FIELDS.map((f) => (
        <label key={f.field} className="text-sm">
          {f.label}
          <input
            required={f.required}
            type={f.type ?? "text"}
            value={form[f.field]}
            onChange={(event) => updateField(f.field, event.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>
      ))}

      <label className="text-sm">
        Gender
        <select
          value={form.gender}
          onChange={(event) => updateField("gender", event.target.value)}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
        >
          <option value="">Select…</option>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
          <option value="Other">Other</option>
        </select>
      </label>

      <button
        type="submit"
        className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 sm:col-span-2"
      >
        Register patient
      </button>
      {message && <p className="text-sm text-red-700 sm:col-span-2">{message}</p>}
    </form>
  );
}
