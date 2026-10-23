import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiErrorMessage } from "../../api";
import { AdminPage } from "../../components/admin/AdminPage";
import { ADMIN_PRIMARY_BUTTON, ADMIN_SECONDARY_BUTTON } from "../../components/admin/styles";
import { Field } from "../../components/FormControls";
import { Section } from "../../components/ProfileUI";
import { createSpecialty, getSpecialty, parseRouteId, updateSpecialty } from "../../services/adminApi";
import type { SpecialtyDetails, SpecialtyInput } from "../../services/adminApi";

interface SpecialtyFormProps {
  specialty?: SpecialtyDetails;
  cancelTo: string;
  submitLabel: string;
  onSubmit: (input: SpecialtyInput) => Promise<void>;
}

// shared add/edit form; specialty is undefined when adding
function SpecialtyForm({ specialty, cancelTo, submitLabel, onSubmit }: SpecialtyFormProps) {
  const [name, setName] = useState(specialty?.name ?? "");
  const [requiresReferral, setRequiresReferral] = useState(specialty?.requiresReferral ?? false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  // blocks a second submit before the disabled button re-renders
  const submitting = useRef(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    if (!name.trim()) {
      setError("Specialty name is required.");
      return;
    }

    submitting.current = true;
    setSaving(true);
    setError("");
    try {
      await onSubmit({ name, requiresReferral });
    } catch (err) {
      setError(apiErrorMessage(err));
      setSaving(false);
      submitting.current = false;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Specialty Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Specialty Name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <label className="mt-5 flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={requiresReferral}
            onChange={(e) => setRequiresReferral(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-navy"
          />
          <span>
            <span className="font-medium">Requires a referral</span>
            <span className="block text-slate-500">Patients need approval from their primary physician before booking this specialty.</span>
          </span>
        </label>
        {specialty && (
          <p className="mt-4 text-sm text-slate-500">Changing the referral rule applies to future bookings. Existing appointments and referrals are not changed.</p>
        )}
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

export function AdminSpecialtyCreate() {
  const navigate = useNavigate();

  async function handleCreate(input: SpecialtyInput) {
    const created = await createSpecialty(input);
    navigate(`/admin/specialties/${created.specialtyId}`, { state: { message: "Specialty created." } });
  }

  return (
    <AdminPage
      title="Add Specialty"
      description="Add a medical specialty. New specialties start out active and aren't assigned to any doctor."
      back={{ to: "/admin/specialties", label: "Back to Specialties" }}
    >
      <SpecialtyForm cancelTo="/admin/specialties" submitLabel="Create Specialty" onSubmit={handleCreate} />
    </AdminPage>
  );
}

export function AdminSpecialtyEdit() {
  const specialtyId = parseRouteId(useParams().id);
  const navigate = useNavigate();
  const [specialty, setSpecialty] = useState<SpecialtyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSpecialty() {
      setLoading(true);
      setError("");
      setSpecialty(null);

      if (specialtyId === null) {
        setError("This specialty ID is not valid.");
        setLoading(false);
        return;
      }

      try {
        const data = await getSpecialty(specialtyId);
        if (active) setSpecialty(data);
      } catch (err) {
        if (active) setError(apiErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSpecialty();
    return () => {
      active = false;
    };
  }, [specialtyId]);

  const detailsPath = specialtyId ? `/admin/specialties/${specialtyId}` : "/admin/specialties";

  async function handleSave(input: SpecialtyInput) {
    if (specialtyId === null) return;
    await updateSpecialty(specialtyId, input);
    navigate(detailsPath, { state: { message: "Changes saved." } });
  }

  return (
    <AdminPage
      title={specialty ? `Edit ${specialty.name}` : "Edit Specialty"}
      description="Update the specialty name and referral rule. Status is managed on the specialty page."
      back={{ to: detailsPath, label: specialtyId ? "Back to Specialty" : "Back to Specialties" }}
    >
      {loading && <p className="text-sm text-slate-600">Loading specialty...</p>}
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {specialty && <SpecialtyForm specialty={specialty} cancelTo={detailsPath} submitLabel="Save Changes" onSubmit={handleSave} />}
    </AdminPage>
  );
}
