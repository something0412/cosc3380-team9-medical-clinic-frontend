import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiErrorMessage } from "../../api";
import { AdminPage } from "../../components/admin/AdminPage";
import { ActiveBadge } from "../../components/admin/StatusBadges";
import { InfoGrid, InfoItem, Section } from "../../components/ProfileUI";
import { getOffice, parseRouteId } from "../../services/adminApi";
import type { OfficeDetails } from "../../services/adminApi";

export function AdminOfficeDetails() {
  const officeId = parseRouteId(useParams().id);
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

  return (
    <AdminPage
      title={office ? office.name : "Office Details"}
      description={office ? `Office ID ${office.officeId} · ${office.city}, ${office.state}` : undefined}
      back={{ to: "/admin/offices", label: "Back to Offices" }}
    >
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
              <InfoItem label="Status" value={<ActiveBadge isActive={office.isActive} />} />
              <InfoItem label="Phone" value={office.phone} />
              <InfoItem
                label="Assigned Employees"
                value={`${office.employeeCount} total · ${office.activeEmployeeCount} active`}
              />
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
        </>
      )}
    </AdminPage>
  );
}
