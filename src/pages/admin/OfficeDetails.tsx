import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { apiErrorMessage } from "../../api";
import { AdminPage } from "../../components/admin/AdminPage";
import { ActiveBadge } from "../../components/admin/StatusBadges";
import { ConfirmPanel, StatusRow } from "../../components/admin/StatusControls";
import { ADMIN_DANGER_BUTTON, ADMIN_PRIMARY_BUTTON } from "../../components/admin/styles";
import { InfoGrid, InfoItem, Section } from "../../components/ProfileUI";
import { getOffice, parseRouteId, setOfficeStatus } from "../../services/adminApi";
import type { OfficeDetails } from "../../services/adminApi";

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

// activate or deactivate an office
function OfficeStatus({ office, onChange }: { office: OfficeDetails; onChange: (updated: OfficeDetails) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // blocks a second request before the disabled buttons re-render
  const busy = useRef(false);

  const assigned = office.activeEmployeeCount + office.activeScheduleCount > 0;
  const note = !office.isActive
    ? "Inactive offices can't be chosen for new employee assignments."
    : assigned
      ? `This office has ${plural(office.activeEmployeeCount, "active employee")} and ${plural(office.activeScheduleCount, "active doctor schedule")}. They must be reassigned before it can be deactivated.`
      : "No active employees or doctor schedules are assigned to this office.";

  async function changeStatus(isActive: boolean) {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await setOfficeStatus(office.officeId, isActive);
      setConfirming(false);
      onChange(updated);
      setSuccess(isActive ? "Office activated." : "Office deactivated.");
    } catch (err) {
      setConfirming(false);
      setError(apiErrorMessage(err));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return (
    <Section title="Office Status">
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

      <StatusRow label="Status" status={<ActiveBadge plain isActive={office.isActive} />} note={note} showActions={!confirming}>
        {office.isActive ? (
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
            Deactivate Office
          </button>
        ) : (
          <button type="button" onClick={() => changeStatus(true)} disabled={saving} className={ADMIN_PRIMARY_BUTTON}>
            Activate Office
          </button>
        )}
      </StatusRow>

      {confirming && (
        <ConfirmPanel
          text={`Deactivate ${office.name}? It will no longer be available for new employee assignments. Employees and schedules are not changed automatically.`}
          confirmLabel="Deactivate Office"
          saving={saving}
          onConfirm={() => changeStatus(false)}
          onCancel={() => setConfirming(false)}
        />
      )}
    </Section>
  );
}

export function AdminOfficeDetails() {
  const officeId = parseRouteId(useParams().id);
  // set by the add and edit forms after saving
  const [savedMessage, setSavedMessage] = useState((useLocation().state as { message?: string } | null)?.message);
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

  function handleStatusChange(updated: OfficeDetails) {
    setOffice(updated);
    setSavedMessage(undefined);
  }

  return (
    <AdminPage
      title={office ? office.name : "Office Details"}
      description={office ? `Office ID ${office.officeId} · ${office.city}, ${office.state}` : undefined}
      back={{ to: "/admin/offices", label: "Back to Offices" }}
      actions={
        office && (
          <Link to={`/admin/offices/${office.officeId}/edit`} className={ADMIN_PRIMARY_BUTTON}>
            Edit Office
          </Link>
        )
      }
    >
      {savedMessage && office && (
        <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {savedMessage}
        </p>
      )}

      {loading && <p className="text-sm text-slate-600">Loading office...</p>}

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {office && (
        <>
          <Section title="Office Information">
            <InfoGrid>
              <InfoItem label="Office ID" value={office.officeId} />
              <InfoItem label="Phone" value={office.phone} />
              <InfoItem
                label="Assigned Employees"
                value={`${office.employeeCount} total · ${office.activeEmployeeCount} active`}
              />
              <InfoItem label="Active Doctor Schedules" value={String(office.activeScheduleCount)} />
            </InfoGrid>
          </Section>

          <Section title="Address">
            <InfoGrid>
              <InfoItem label="Street" value={office.street} />
              <InfoItem label="Apt / Suite" value={office.apt} />
              <InfoItem label="City" value={office.city} />
              <InfoItem label="State" value={office.state} />
              <InfoItem label="ZIP Code" value={office.zip} />
            </InfoGrid>
          </Section>

          <OfficeStatus office={office} onChange={handleStatusChange} />
        </>
      )}
    </AdminPage>
  );
}
