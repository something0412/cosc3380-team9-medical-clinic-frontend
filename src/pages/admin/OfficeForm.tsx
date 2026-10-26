import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiErrorMessage } from "../../api";
import { AdminPage } from "../../components/admin/AdminPage";
import { ADMIN_PRIMARY_BUTTON, ADMIN_SECONDARY_BUTTON } from "../../components/admin/styles";
import { Field, SelectField } from "../../components/FormControls";
import { Section } from "../../components/ProfileUI";
import { US_STATES, createOffice, getOffice, parseRouteId, updateOffice } from "../../services/adminApi";
import type { OfficeDetails, OfficeInput } from "../../services/adminApi";

const EMPTY_VALUES: OfficeInput = { name: "", street: "", apt: "", city: "", state: "", zip: "", phone: "" };

// checks that the browser's required fields can't cover
function formProblem(values: OfficeInput) {
  if (!/^\d{5}(-\d{4})?$/.test(values.zip.trim())) return "ZIP code must be 5 digits or ZIP+4 (12345-6789).";
  if (!/^[\d\s()+.-]+$/.test(values.phone.trim()) || !/^1?\d{10}$/.test(values.phone.replace(/\D/g, ""))) {
    return "Enter a valid 10-digit phone number.";
  }
  return "";
}

interface OfficeFormProps {
  office?: OfficeDetails;
  cancelTo: string;
  submitLabel: string;
  onSubmit: (input: OfficeInput) => Promise<void>;
}

// shared add/edit form; office is undefined when adding
function OfficeForm({ office, cancelTo, submitLabel, onSubmit }: OfficeFormProps) {
  const [values, setValues] = useState<OfficeInput>(office ? { ...office, apt: office.apt ?? "" } : EMPTY_VALUES);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  // blocks a second submit before the disabled button re-renders
  const submitting = useRef(false);

  function update(field: keyof OfficeInput) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setValues((v) => ({ ...v, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting.current) return;

    const problem = formProblem(values);
    if (problem) {
      setError(problem);
      return;
    }

    submitting.current = true;
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        name: values.name,
        street: values.street,
        apt: values.apt || null,
        city: values.city,
        state: values.state,
        zip: values.zip,
        phone: values.phone,
      });
    } catch (err) {
      setError(apiErrorMessage(err));
      setSaving(false);
      submitting.current = false;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Office Information">
        <p className="-mt-2 mb-4 text-sm text-slate-500">All fields are required unless marked optional.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Office Name" required maxLength={100} value={values.name} onChange={update("name")} />
          <Field
            label="Phone Number"
            type="tel"
            required
            maxLength={20}
            placeholder="713-555-0100"
            value={values.phone}
            onChange={update("phone")}
          />
        </div>
      </Section>

      <Section title="Address">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Street Address" required maxLength={100} value={values.street} onChange={update("street")} />
          <Field label="Apt / Suite (optional)" maxLength={20} value={values.apt ?? ""} onChange={update("apt")} />
          <Field label="City" required maxLength={50} value={values.city} onChange={update("city")} />
          <div className="grid gap-4 lg:grid-cols-2">
            <SelectField label="State" required value={values.state} onChange={update("state")}>
              <option value="">Select</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </SelectField>
            <Field
              label="ZIP Code"
              required
              inputMode="numeric"
              maxLength={10}
              placeholder="77001"
              value={values.zip}
              onChange={update("zip")}
            />
          </div>
        </div>
      </Section>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <Link to={cancelTo} className={ADMIN_SECONDARY_BUTTON}>
          Cancel
        </Link>
        <button type="submit" disabled={saving} className={ADMIN_PRIMARY_BUTTON}>
          {saving ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function AdminOfficeCreate() {
  const navigate = useNavigate();

  async function handleCreate(input: OfficeInput) {
    const created = await createOffice(input);
    navigate(`/admin/offices/${created.officeId}`, { state: { message: "Office created." } });
  }

  return (
    <AdminPage
      title="Add Office"
      description="Add a new clinic location. New offices start out active."
      back={{ to: "/admin/offices", label: "Back to Offices" }}
    >
      <OfficeForm cancelTo="/admin/offices" submitLabel="Create Office" onSubmit={handleCreate} />
    </AdminPage>
  );
}

export function AdminOfficeEdit() {
  const officeId = parseRouteId(useParams().id);
  const navigate = useNavigate();
  const [office, setOffice] = useState<OfficeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadOffice() {
      setLoading(true);
      setError("");
      setOffice(null);

      if (officeId === null) {
        setError("This office ID is not valid.");
        setLoading(false);
        return;
      }

      try {
        const data = await getOffice(officeId);
        if (active) setOffice(data);
      } catch (err) {
        if (active) setError(apiErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOffice();
    return () => {
      active = false;
    };
  }, [officeId]);

  const detailsPath = officeId ? `/admin/offices/${officeId}` : "/admin/offices";

  async function handleSave(input: OfficeInput) {
    if (officeId === null) return;
    await updateOffice(officeId, input);
    navigate(detailsPath, { state: { message: "Changes saved." } });
  }

  return (
    <AdminPage
      title={office ? `Edit ${office.name}` : "Edit Office"}
      description="Update this office's name, address, and phone number. Status is managed on the office page."
      back={{ to: detailsPath, label: officeId ? "Back to Office" : "Back to Offices" }}
    >
      {loading && <p className="text-sm text-slate-600">Loading office...</p>}
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {office && <OfficeForm office={office} cancelTo={detailsPath} submitLabel="Save Changes" onSubmit={handleSave} />}
    </AdminPage>
  );
}
