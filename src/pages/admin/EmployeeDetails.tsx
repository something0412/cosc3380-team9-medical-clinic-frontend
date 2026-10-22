import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { apiErrorMessage } from "../../api";
import { AdminPage } from "../../components/admin/AdminPage";
import { ADMIN_PRIMARY_BUTTON } from "../../components/admin/styles";
import { InfoGrid, InfoItem, Section } from "../../components/ProfileUI";
import { getEmployee, parseEmployeeId } from "../../services/adminApi";
import type { AdminEmployeeDetails as Employee } from "../../services/adminApi";
import { formatId } from "../../utils/id";
import { AccountManagement } from "./AccountManagement";

export function AdminEmployeeDetails() {
  const employeeId = parseEmployeeId(useParams().id);
  // set by the add and edit forms after saving
  const [savedMessage, setSavedMessage] = useState((useLocation().state as { message?: string } | null)?.message);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadEmployee() {
      setLoading(true);
      setError("");
      setEmployee(null);

      if (employeeId === null) {
        setError("This employee ID is not valid.");
        setLoading(false);
        return;
      }

      try {
        const data = await getEmployee(employeeId);
        if (active) setEmployee(data);
      } catch (err) {
        if (active) setError(apiErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEmployee();
    return () => {
      active = false;
    };
  }, [employeeId]);

  // reload after an account change without clearing the page
  async function refreshEmployee() {
    if (employeeId === null) return;
    setEmployee(await getEmployee(employeeId));
    setSavedMessage(undefined);
  }

  return (
    <AdminPage
      title={employee ? `${employee.firstName} ${employee.lastName}` : "Employee Details"}
      description={employee ? `Staff ID ${formatId(employee.employeeId)} · ${employee.employeeType}` : undefined}
      back={{ to: "/admin/employees", label: "Back to Employees" }}
      actions={
        employee && (
          <Link to={`/admin/employees/${employee.employeeId}/edit`} className={ADMIN_PRIMARY_BUTTON}>
            Edit Employee
          </Link>
        )
      }
    >
      {savedMessage && employee && (
        <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {savedMessage}
        </p>
      )}

      {loading && <p className="text-sm text-slate-600">Loading employee...</p>}

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {employee && (
        <>
          <Section title="Employee Information">
            <InfoGrid>
              <InfoItem label="Staff ID" value={formatId(employee.employeeId)} />
              <InfoItem label="Role" value={employee.employeeType} />
              <InfoItem label="Office" value={employee.officeName} />
              <InfoItem label="Date of Birth" value={employee.dob} />
            </InfoGrid>
          </Section>

          <Section title="Contact Information">
            <InfoGrid>
              <InfoItem label="Email" value={<span className="break-all">{employee.email}</span>} />
              <InfoItem label="Phone" value={employee.phone} />
            </InfoGrid>
          </Section>

          <AccountManagement employee={employee} onChange={refreshEmployee} />

          {employee.doctor && (
            <Section title="Medical License">
              <InfoGrid>
                <InfoItem label="License Number" value={employee.doctor.licenseNumber} />
                <InfoItem label="Issuing State" value={employee.doctor.licenseState} />
                <InfoItem label="License Expiration" value={employee.doctor.licenseExpiration} />
                <InfoItem label="NPI Number" value={employee.doctor.npiNumber} />
                <InfoItem label="DEA Number" value={employee.doctor.deaNumber} />
                <InfoItem
                  label="Specialties"
                  value={employee.doctor.specialties.map((s) => (s.isPrimary ? `${s.name} (primary)` : s.name)).join(", ")}
                />
              </InfoGrid>
            </Section>
          )}

          {employee.nurse && (
            <Section title="Nursing License">
              <InfoGrid>
                <InfoItem label="License Number" value={employee.nurse.licenseNumber} />
                <InfoItem label="Nursing Level" value={employee.nurse.nursingLevel} />
                <InfoItem label="Issuing State" value={employee.nurse.licenseState} />
                <InfoItem label="License Expiration" value={employee.nurse.licenseExpiration} />
              </InfoGrid>
            </Section>
          )}
        </>
      )}
    </AdminPage>
  );
}
