import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { apiErrorMessage } from "../../../api";
import {
  addEmergencyContact,
  completeForm,
  createPortalAccount,
  getPatientForms,
  getPatientProfile,
  removeEmergencyContact,
  saveInsurance,
  setInsuranceStatus,
  updateEmergencyContact,
  updatePatient,
} from "../../../services/frontDeskApi";
import type { ContactInput } from "../../../services/frontDeskApi";
import type { FormStatus, Insurance, PatientDetails, PatientProfile } from "../../../types";

const TABS = ["Details", "Contacts", "Insurance", "Forms", "Portal"] as const;
type Tab = (typeof TABS)[number];

const inputClass = "mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm";
const buttonClass = "rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800";
const linkButtonClass = "text-sm font-medium text-blue-700 hover:underline";

// One patient's profile at the front desk: demographics plus everything
// collected at intake, one tab per area. Every save reloads the profile
// so the panel always shows what the database holds.
export function PatientProfilePanel({ patientId }: { patientId: number }) {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [tab, setTab] = useState<Tab>("Details");
  const [error, setError] = useState("");
  // Bumping this re-runs the effect below, reloading the profile.
  const [reloadCount, setReloadCount] = useState(0);
  const reload = () => setReloadCount((n) => n + 1);

  useEffect(() => {
    let ignore = false;
    getPatientProfile(patientId)
      .then((data) => {
        if (!ignore) setProfile(data);
      })
      .catch(() => {
        if (!ignore) setError("Could not load this patient.");
      });
    return () => {
      ignore = true;
    };
  }, [patientId, reloadCount]);

  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!profile) return <p className="text-sm text-gray-500">Loading patient…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {profile.firstName} {profile.lastName}
          </h2>
          <p className="text-sm text-gray-600">
            Patient #{profile.patientId} · DOB {profile.dob} · {profile.phone}
          </p>
        </div>
        <Link to={`/staff/schedule?patientId=${profile.patientId}`} className={buttonClass}>
          Book appointment
        </Link>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm ${
              tab === t ? "border-b-2 border-blue-600 font-medium text-blue-700" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Details" && <DetailsTab profile={profile} onSaved={reload} />}
      {tab === "Contacts" && <ContactsTab profile={profile} onSaved={reload} />}
      {tab === "Insurance" && <InsuranceTab profile={profile} onSaved={reload} />}
      {tab === "Forms" && <FormsTab patientId={profile.patientId} />}
      {tab === "Portal" && <PortalTab profile={profile} onSaved={reload} />}
    </div>
  );
}

type TabProps = { profile: PatientProfile; onSaved: () => void };

// --- Details ----------------------------------------------------------------

const DETAIL_FIELDS: { field: keyof PatientDetails; label: string; type?: string; required?: boolean }[] = [
  { field: "firstName", label: "First name", required: true },
  { field: "lastName", label: "Last name", required: true },
  { field: "dob", label: "Date of birth", type: "date", required: true },
  { field: "phone", label: "Phone", type: "tel", required: true },
  { field: "email", label: "Email", type: "email" },
  { field: "address", label: "Address" },
];

function DetailsTab({ profile, onSaved }: TabProps) {
  const { user } = useAuth();
  const [details, setDetails] = useState<PatientDetails>({
    firstName: profile.firstName,
    lastName: profile.lastName,
    dob: profile.dob,
    gender: profile.gender ?? "",
    phone: profile.phone,
    email: profile.email ?? "",
    address: profile.address ?? "",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    try {
      await updatePatient(profile.patientId, details);
      onSaved();
    } catch (err) {
      alert(`Could not save: ${apiErrorMessage(err)}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
      {DETAIL_FIELDS.map((f) => (
        <label key={f.field} className="text-sm">
          {f.label}
          <input
            required={f.required}
            type={f.type ?? "text"}
            value={details[f.field]}
            onChange={(e) => setDetails({ ...details, [f.field]: e.target.value })}
            className={inputClass}
          />
        </label>
      ))}
      <label className="text-sm">
        Gender
        <select
          value={details.gender}
          onChange={(e) => setDetails({ ...details, gender: e.target.value })}
          className={inputClass}
        >
          <option value="">Select…</option>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
          <option value="Other">Other</option>
        </select>
      </label>
      <button type="submit" className={`${buttonClass} sm:col-span-2`}>
        Save details
      </button>
    </form>
  );
}

// --- Emergency contacts ---------------------------------------------------

const EMPTY_CONTACT: ContactInput = { firstName: "", lastName: "", relationship: "", phoneNumber: "", isPrimary: false };

const CONTACT_FIELDS: { field: "firstName" | "lastName" | "relationship" | "phoneNumber"; label: string }[] = [
  { field: "firstName", label: "First name" },
  { field: "lastName", label: "Last name" },
  { field: "relationship", label: "Relationship" },
  { field: "phoneNumber", label: "Phone" },
];

// Exactly one contact is primary: the first one added always is, and the
// primary can't be removed until another contact is made primary (the
// backend enforces both).
function ContactsTab({ profile, onSaved }: TabProps) {
  const { user } = useAuth();
  const [form, setForm] = useState<ContactInput>(EMPTY_CONTACT);
  // Which contact the form is editing; null = adding a new one.
  const [editingId, setEditingId] = useState<number | null>(null);

  // Runs one save, then resets the form and reloads the profile.
  async function run(action: () => Promise<void>, failure: string) {
    try {
      await action();
      setForm(EMPTY_CONTACT);
      setEditingId(null);
      onSaved();
    } catch (err) {
      alert(`${failure}: ${apiErrorMessage(err)}`);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    run(
      () =>
        editingId
          ? updateEmergencyContact(editingId, form)
          : addEmergencyContact(profile.patientId, form),
      "Could not save contact",
    );
  }

  return (
    <div className="space-y-4">
      {profile.emergencyContacts.length === 0 ? (
        <p className="text-sm text-gray-500">No emergency contacts.</p>
      ) : (
        <ul className="space-y-2">
          {profile.emergencyContacts.map((c) => (
            <li
              key={c.emergencyContactId}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-gray-200 p-2 text-sm"
            >
              <span>
                {c.firstName} {c.lastName} ({c.relationship}) · {c.phoneNumber}
                {c.isPrimary && <span className="ml-2 font-medium text-green-700">Primary</span>}
              </span>
              <span className="flex gap-3">
                <button
                  type="button"
                  className={linkButtonClass}
                  onClick={() => {
                    setEditingId(c.emergencyContactId);
                    setForm({ ...c, isPrimary: false });
                  }}
                >
                  Edit
                </button>
                {!c.isPrimary && user && (
                  <>
                    <button
                      type="button"
                      className={linkButtonClass}
                      onClick={() =>
                        run(
                          () => updateEmergencyContact(c.emergencyContactId, { ...c, isPrimary: true }),
                          "Could not make primary",
                        )
                      }
                    >
                      Make primary
                    </button>
                    <button
                      type="button"
                      className={linkButtonClass}
                      onClick={() => run(() => removeEmergencyContact(c.emergencyContactId), "Could not remove")}
                    >
                      Remove
                    </button>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="grid gap-3 rounded border border-gray-200 bg-gray-50 p-3 sm:grid-cols-2">
        <h3 className="text-sm font-semibold text-gray-900 sm:col-span-2">
          {editingId ? "Edit contact" : "Add contact"}
        </h3>
        {CONTACT_FIELDS.map((f) => (
          <label key={f.field} className="text-sm">
            {f.label}
            <input
              required
              value={form[f.field]}
              onChange={(e) => setForm({ ...form, [f.field]: e.target.value })}
              className={inputClass}
            />
          </label>
        ))}
        {!editingId && (
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.isPrimary}
              onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
            />
            Make this the primary contact
          </label>
        )}
        <div className="flex gap-3 sm:col-span-2">
          <button type="submit" className={buttonClass}>
            {editingId ? "Save contact" : "Add contact"}
          </button>
          {editingId && (
            <button
              type="button"
              className={linkButtonClass}
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_CONTACT);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// --- Insurance --------------------------------------------------------------

// One policy per patient. Saving a different policy sends its status back
// to Pending until it's verified again.
function InsuranceTab({ profile, onSaved }: TabProps) {
  const { user } = useAuth();
  const [provider, setProvider] = useState(profile.insurance?.provider ?? "");
  const [policyNumber, setPolicyNumber] = useState(profile.insurance?.policyNumber ?? "");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    try {
      await saveInsurance(profile.patientId, { provider, policyNumber });
      onSaved();
    } catch (err) {
      alert(`Could not save insurance: ${apiErrorMessage(err)}`);
    }
  }

  async function changeStatus(status: Insurance["status"]) {
    if (!user) return;
    try {
      await setInsuranceStatus(profile.patientId, status);
      onSaved();
    } catch (err) {
      alert(`Could not update status: ${apiErrorMessage(err)}`);
    }
  }

  return (
    <div className="space-y-4">
      {profile.insurance ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span>
            Status: <span className="font-medium">{profile.insurance.status}</span>
          </span>
          {(["Verified", "Denied", "Pending"] as const)
            .filter((s) => s !== profile.insurance?.status)
            .map((s) => (
              <button key={s} type="button" className={linkButtonClass} onClick={() => changeStatus(s)}>
                Mark {s.toLowerCase()}
              </button>
            ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No insurance on file.</p>
      )}

      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Provider
          <input required value={provider} onChange={(e) => setProvider(e.target.value)} className={inputClass} />
        </label>
        <label className="text-sm">
          Policy number
          <input required value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} className={inputClass} />
        </label>
        <button type="submit" className={`${buttonClass} sm:col-span-2`}>
          Save insurance
        </button>
      </form>
    </div>
  );
}

// --- Forms ------------------------------------------------------------------

// Every form type with this patient's status. The receptionist marks a
// form completed when the patient hands it in.
function FormsTab({ patientId }: { patientId: number }) {
  const { user } = useAuth();
  const [forms, setForms] = useState<FormStatus[]>([]);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let ignore = false;
    getPatientForms(patientId)
      .then((data) => {
        if (!ignore) setForms(data);
      })
      .catch(() => {
        if (!ignore) setForms([]);
      });
    return () => {
      ignore = true;
    };
  }, [patientId, reloadCount]);

  async function markCompleted(formTypeId: number) {
    if (!user) return;
    try {
      await completeForm(patientId, formTypeId);
      setReloadCount((n) => n + 1);
    } catch (err) {
      alert(`Could not update form: ${apiErrorMessage(err)}`);
    }
  }

  if (forms.length === 0) return <p className="text-sm text-gray-500">No form types set up.</p>;

  return (
    <ul className="space-y-2">
      {forms.map((f) => (
        <li key={f.formTypeId} className="flex items-center justify-between rounded border border-gray-200 p-2 text-sm">
          <span>
            {f.name}
            {f.isRequired && <span className="ml-2 text-xs text-gray-500">Required</span>}
          </span>
          {f.status === "Completed" ? (
            <span className="text-green-700">Completed {f.submittedDate}</span>
          ) : (
            <span className="flex items-center gap-3">
              <span className={f.isRequired ? "font-medium text-amber-700" : "text-gray-500"}>{f.status}</span>
              <button type="button" className={linkButtonClass} onClick={() => markCompleted(f.formTypeId)}>
                Mark completed
              </button>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

// --- Portal account ---------------------------------------------------------------

// The patient logs in to the portal with their patient number, email and
// this password.
function PortalTab({ profile, onSaved }: TabProps) {
  const { user } = useAuth();
  const [password, setPassword] = useState("");

  if (profile.hasPortalAccount) {
    return <p className="text-sm text-gray-700">Portal account active. Username: {profile.email}</p>;
  }
  if (!profile.email) {
    return <p className="text-sm text-gray-500">Add an email address on the Details tab first.</p>;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    try {
      await createPortalAccount(profile.patientId, password);
      setPassword("");
      onSaved();
    } catch (err) {
      alert(`Could not create account: ${apiErrorMessage(err)}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm text-gray-600">Create a portal login for {profile.email}.</p>
      <input
        required
        type="password"
        minLength={8}
        placeholder="Password (8+ characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={inputClass}
      />
      <button type="submit" className={buttonClass}>
        Create portal account
      </button>
    </form>
  );
}
