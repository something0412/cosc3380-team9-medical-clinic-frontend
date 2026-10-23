import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { apiErrorMessage } from "../../api";
import { AdminPage } from "../../components/admin/AdminPage";
import { ActiveBadge, ReferralBadge } from "../../components/admin/StatusBadges";
import { ConfirmPanel, StatusRow } from "../../components/admin/StatusControls";
import { ADMIN_DANGER_BUTTON, ADMIN_PRIMARY_BUTTON } from "../../components/admin/styles";
import { InfoGrid, InfoItem, Section } from "../../components/ProfileUI";
import { getSpecialty, parseRouteId, setSpecialtyStatus } from "../../services/adminApi";
import type { SpecialtyDetails } from "../../services/adminApi";

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

// activate or deactivate a specialty
function SpecialtyStatus({ specialty, onChange }: { specialty: SpecialtyDetails; onChange: (updated: SpecialtyDetails) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // blocks a second request before the disabled buttons re-render
  const busy = useRef(false);

  const inUse = specialty.activeDoctorCount + specialty.activeScheduleCount > 0;
  const note = !specialty.isActive
    ? "Inactive specialties can't be assigned to doctors."
    : inUse
      ? `Used by ${plural(specialty.activeDoctorCount, "active doctor")} and ${plural(specialty.activeScheduleCount, "active doctor schedule")}. They must be updated before it can be deactivated.`
      : "No active doctors or doctor schedules use this specialty.";

  async function changeStatus(isActive: boolean) {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await setSpecialtyStatus(specialty.specialtyId, isActive);
      setConfirming(false);
      onChange(updated);
      setSuccess(isActive ? "Specialty activated." : "Specialty deactivated.");
    } catch (err) {
      setConfirming(false);
      setError(apiErrorMessage(err));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return (
    <Section title="Specialty Status">
      {success && (
        <p role="status" className="mb-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {success}
        </p>
      )}
      {error && (
        <p role="alert" className="mb-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <StatusRow label="Status" status={<ActiveBadge isActive={specialty.isActive} />} note={note} showActions={!confirming}>
        {specialty.isActive ? (
          <button
            type="button"
            onClick={() => {
              setConfirming(true);
              setError("");
              setSuccess("");
            }}
            disabled={saving}
            className={ADMIN_DANGER_BUTTON}
          >
            Deactivate Specialty
          </button>
        ) : (
          <button type="button" onClick={() => changeStatus(true)} disabled={saving} className={ADMIN_PRIMARY_BUTTON}>
            Activate Specialty
          </button>
        )}
      </StatusRow>

      {confirming && (
        <ConfirmPanel
          text={`Deactivate ${specialty.name}? It will no longer be available for new doctor assignments. Existing assignments, schedules, and appointments are not changed.`}
          confirmLabel="Deactivate Specialty"
          saving={saving}
          onConfirm={() => changeStatus(false)}
          onCancel={() => setConfirming(false)}
        />
      )}
    </Section>
  );
}

export function AdminSpecialtyDetails() {
  const specialtyId = parseRouteId(useParams().id);
  // set by the add and edit forms after saving
  const [savedMessage, setSavedMessage] = useState((useLocation().state as { message?: string } | null)?.message);
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

  function handleStatusChange(updated: SpecialtyDetails) {
    setSpecialty(updated);
    setSavedMessage(undefined);
  }

  return (
    <AdminPage
      title={specialty ? specialty.name : "Specialty Details"}
      description={specialty ? `Specialty ID ${specialty.specialtyId}` : undefined}
      back={{ to: "/admin/specialties", label: "Back to Specialties" }}
      actions={
        specialty && (
          <Link to={`/admin/specialties/${specialty.specialtyId}/edit`} className={ADMIN_PRIMARY_BUTTON}>
            Edit Specialty
          </Link>
        )
      }
    >
      {savedMessage && specialty && (
        <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {savedMessage}
        </p>
      )}

      {loading && <p className="text-sm text-slate-600">Loading specialty...</p>}

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {specialty && (
        <>
          <Section title="Specialty Information">
            <InfoGrid>
              <InfoItem label="Specialty ID" value={specialty.specialtyId} />
              <InfoItem label="Referral" value={<ReferralBadge requiresReferral={specialty.requiresReferral} />} />
              <InfoItem
                label="Assigned Doctors"
                value={`${specialty.doctorCount} total · ${specialty.activeDoctorCount} active`}
              />
              <InfoItem label="Active Doctor Schedules" value={String(specialty.activeScheduleCount)} />
            </InfoGrid>
            <p className="mt-4 text-sm text-slate-500">
              {specialty.requiresReferral
                ? "Patients need an approved referral from their primary physician to book this specialty."
                : "Patients can book this specialty without a referral."}
            </p>
          </Section>

          <SpecialtyStatus specialty={specialty} onChange={handleStatusChange} />
        </>
      )}
    </AdminPage>
  );
}
