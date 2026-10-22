import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiErrorMessage } from "../../api";
import { AdminPage } from "../../components/admin/AdminPage";
import { ADMIN_PRIMARY_BUTTON, ADMIN_SECONDARY_BUTTON } from "../../components/admin/styles";
import { Field, SelectField } from "../../components/FormControls";
import { Section } from "../../components/ProfileUI";
import {
  NURSING_LEVELS,
  createEmployee,
  getEmployee,
  getEmployeeTypes,
  getOffices,
  getSpecialties,
  parseEmployeeId,
  updateEmployee,
} from "../../services/adminApi";
import type {
  AdminEmployeeDetails,
  EmployeeInput,
  EmployeeType,
  NewEmployeeInput,
  Office,
  Specialty,
} from "../../services/adminApi";

type RoleKind = "doctor" | "nurse" | "other";

// doctor and nurse roles need license details
function roleKind(typeName: string | undefined): RoleKind {
  const name = typeName?.toLowerCase();
  return name === "doctor" || name === "nurse" ? name : "other";
}

const EMPTY_VALUES = {
  firstName: "",
  lastName: "",
  dob: "",
  email: "",
  phone: "",
  employeeTypeId: "",
  officeId: "",
  createLogin: true,
  username: "",
  password: "",
  confirmPassword: "",
  licenseNumber: "",
  licenseState: "",
  licenseExpiration: "",
  npiNumber: "",
  deaNumber: "",
  specialtyIds: [] as number[],
  primarySpecialtyId: "",
  nursingLevel: "",
};

type FormValues = typeof EMPTY_VALUES;

function toFormValues(employee: AdminEmployeeDetails): FormValues {
  const license = employee.doctor ?? employee.nurse;
  const primary = employee.doctor?.specialties.find((s) => s.isPrimary);
  return {
    ...EMPTY_VALUES,
    firstName: employee.firstName,
    lastName: employee.lastName,
    dob: employee.dob,
    email: employee.email,
    phone: employee.phone,
    employeeTypeId: String(employee.employeeTypeId),
    officeId: String(employee.officeId),
    createLogin: false,
    licenseNumber: license?.licenseNumber ?? "",
    licenseState: license?.licenseState ?? "",
    licenseExpiration: license?.licenseExpiration ?? "",
    npiNumber: employee.doctor?.npiNumber ?? "",
    deaNumber: employee.doctor?.deaNumber ?? "",
    specialtyIds: employee.doctor?.specialties.map((s) => s.specialtyId) ?? [],
    primarySpecialtyId: primary ? String(primary.specialtyId) : "",
    nursingLevel: employee.nurse?.nursingLevel ?? "",
  };
}

function toEmployeeInput(values: FormValues, kind: RoleKind): EmployeeInput {
  const license = {
    licenseNumber: values.licenseNumber,
    licenseState: values.licenseState,
    licenseExpiration: values.licenseExpiration,
  };
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    dob: values.dob,
    email: values.email,
    phone: values.phone,
    employeeTypeId: Number(values.employeeTypeId),
    officeId: Number(values.officeId),
    doctor:
      kind === "doctor"
        ? {
            ...license,
            npiNumber: values.npiNumber,
            deaNumber: values.deaNumber || null,
            specialtyIds: values.specialtyIds,
            primarySpecialtyId: Number(values.primarySpecialtyId),
          }
        : null,
    nurse: kind === "nurse" ? { ...license, nursingLevel: values.nursingLevel } : null,
  };
}

// checks that the browser's required fields can't cover
function formProblem(values: FormValues, kind: RoleKind, isNew: boolean) {
  if (isNew && values.createLogin && values.password !== values.confirmPassword) return "Passwords do not match.";
  if (kind === "doctor" && values.specialtyIds.length === 0) return "Select at least one specialty.";
  if (kind === "doctor" && !values.specialtyIds.includes(Number(values.primarySpecialtyId))) return "Choose a primary specialty.";
  return "";
}

interface EmployeeFormProps {
  employee?: AdminEmployeeDetails;
  cancelTo: string;
  submitLabel: string;
  onSubmit: (input: EmployeeInput, login: NewEmployeeInput["login"]) => Promise<void>;
}

// shared add/edit form; employee is undefined when adding
function EmployeeForm({ employee, cancelTo, submitLabel, onSubmit }: EmployeeFormProps) {
  const isNew = !employee;
  const [values, setValues] = useState<FormValues>(employee ? toFormValues(employee) : EMPTY_VALUES);
  const [types, setTypes] = useState<EmployeeType[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  // blocks a second submit before the disabled button re-renders
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      try {
        const [typeList, officeList, specialtyList] = await Promise.all([getEmployeeTypes(), getOffices(), getSpecialties()]);
        if (active) {
          setTypes(typeList);
          setOffices(officeList);
          setSpecialties(specialtyList);
        }
      } catch (err) {
        if (active) setLoadError(apiErrorMessage(err));
      } finally {
        if (active) setLoadingOptions(false);
      }
    }

    loadOptions();
    return () => {
      active = false;
    };
  }, []);

  const currentType = employee && { employeeTypeId: employee.employeeTypeId, typeName: employee.employeeType };
  const allTypes = currentType && !types.some((t) => t.employeeTypeId === currentType.employeeTypeId) ? [...types, currentType] : types;
  const selectedType = allTypes.find((t) => String(t.employeeTypeId) === values.employeeTypeId);
  const kind = roleKind(selectedType?.typeName);

  // doctor and nurse records are linked to licenses, appointments, and schedules
  const roleLocked = !!employee && (employee.doctor !== null || employee.nurse !== null || roleKind(employee.employeeType) !== "other");
  const typeOptions = isNew ? allTypes : allTypes.filter((t) => roleKind(t.typeName) === "other");

  const officeOptions = offices.filter((o) => o.isActive || o.officeId === employee?.officeId);
  const specialtyOptions = specialties.filter((s) => s.isActive || values.specialtyIds.includes(s.specialtyId));
  const selectedSpecialties = specialtyOptions.filter((s) => values.specialtyIds.includes(s.specialtyId));

  function update(field: keyof FormValues) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setValues((v) => ({ ...v, [field]: e.target.value }));
  }

  function toggleSpecialty(specialtyId: number) {
    setValues((v) => {
      const ids = v.specialtyIds.includes(specialtyId) ? v.specialtyIds.filter((id) => id !== specialtyId) : [...v.specialtyIds, specialtyId];
      const keepPrimary = ids.includes(Number(v.primarySpecialtyId));
      return { ...v, specialtyIds: ids, primarySpecialtyId: keepPrimary ? v.primarySpecialtyId : ids.length ? String(ids[0]) : "" };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting.current) return;

    const problem = formProblem(values, kind, isNew);
    if (problem) {
      setError(problem);
      return;
    }

    submitting.current = true;
    setSaving(true);
    setError("");
    const login = isNew && values.createLogin ? { username: values.username, password: values.password } : null;
    try {
      await onSubmit(toEmployeeInput(values, kind), login);
    } catch (err) {
      setError(apiErrorMessage(err));
      setSaving(false);
      submitting.current = false;
    }
  }

  if (loadingOptions) return <p className="text-sm text-slate-600">Loading form...</p>;
  if (loadError) {
    return (
      <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        The form could not be loaded. {loadError}
      </p>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const licenseFields = (
    <>
      <Field label="License Number" required maxLength={50} value={values.licenseNumber} onChange={update("licenseNumber")} />
      <Field
        label="Issuing State"
        required
        maxLength={2}
        pattern="[A-Za-z]{2}"
        title="2-letter state code"
        placeholder="TX"
        value={values.licenseState}
        onChange={(e) => setValues((v) => ({ ...v, licenseState: e.target.value.toUpperCase() }))}
      />
      <Field label="License Expiration" type="date" required value={values.licenseExpiration} onChange={update("licenseExpiration")} />
    </>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Employee Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First Name" required maxLength={50} value={values.firstName} onChange={update("firstName")} />
          <Field label="Last Name" required maxLength={50} value={values.lastName} onChange={update("lastName")} />
          <Field label="Date of Birth" type="date" required max={today} value={values.dob} onChange={update("dob")} />
          <Field label="Phone" type="tel" required maxLength={20} value={values.phone} onChange={update("phone")} />
          <Field label="Email" type="email" required maxLength={100} value={values.email} onChange={update("email")} />
          <SelectField label="Office" required value={values.officeId} onChange={update("officeId")}>
            <option value="">Select an office</option>
            {officeOptions.map((o) => (
              <option key={o.officeId} value={o.officeId}>
                {o.name}
                {o.isActive ? "" : " (inactive)"}
              </option>
            ))}
          </SelectField>
          {roleLocked ? (
            <div>
              <span className="mb-1 block text-sm font-medium text-gray-700">Role</span>
              <p className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700">{employee.employeeType}</p>
            </div>
          ) : (
            <SelectField label="Role" required value={values.employeeTypeId} onChange={update("employeeTypeId")}>
              <option value="">Select a role</option>
              {typeOptions.map((t) => (
                <option key={t.employeeTypeId} value={t.employeeTypeId}>
                  {t.typeName}
                </option>
              ))}
            </SelectField>
          )}
        </div>
        {!isNew && (
          <p className="mt-4 text-sm text-slate-500">
            {roleLocked
              ? "Doctor and nurse roles can't be changed because they are linked to licenses, appointments, and schedules."
              : "Doctor and Nurse roles can't be assigned to existing employees yet."}
          </p>
        )}
      </Section>

      {isNew && (
        <Section title="Login Account">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={values.createLogin}
              onChange={(e) => setValues((v) => ({ ...v, createLogin: e.target.checked }))}
              className="h-4 w-4 accent-navy"
            />
            Create a login account now
          </label>
          {values.createLogin && (
            <>
              <p className="mt-2 text-sm text-slate-500">
                Staff sign in with their staff ID and this password. The username is usually the employee's work email.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Username" required maxLength={50} autoComplete="off" value={values.username} onChange={update("username")} />
                <Field
                  label="Initial Password"
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  value={values.password}
                  onChange={update("password")}
                />
                <Field
                  label="Confirm Password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={values.confirmPassword}
                  onChange={update("confirmPassword")}
                />
              </div>
            </>
          )}
        </Section>
      )}

      {kind === "doctor" && (
        <Section title="Medical License and Specialties">
          <div className="grid gap-4 sm:grid-cols-2">
            {licenseFields}
            <Field
              label="NPI Number"
              required
              inputMode="numeric"
              maxLength={10}
              pattern="\d{10}"
              title="10 digits"
              value={values.npiNumber}
              onChange={update("npiNumber")}
            />
            <Field label="DEA Number (optional)" maxLength={20} value={values.deaNumber} onChange={update("deaNumber")} />
          </div>

          <fieldset className="mt-6">
            <legend className="text-sm font-medium text-gray-700">Specialties</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {specialtyOptions.map((s) => (
                <label key={s.specialtyId} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={values.specialtyIds.includes(s.specialtyId)}
                    onChange={() => toggleSpecialty(s.specialtyId)}
                    className="h-4 w-4 accent-navy"
                  />
                  {s.name}
                </label>
              ))}
            </div>
          </fieldset>

          {selectedSpecialties.length > 0 && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <SelectField label="Primary Specialty" required value={values.primarySpecialtyId} onChange={update("primarySpecialtyId")}>
                {selectedSpecialties.map((s) => (
                  <option key={s.specialtyId} value={s.specialtyId}>
                    {s.name}
                  </option>
                ))}
              </SelectField>
            </div>
          )}
        </Section>
      )}

      {kind === "nurse" && (
        <Section title="Nursing License">
          <div className="grid gap-4 sm:grid-cols-2">
            {licenseFields}
            <SelectField label="Nursing Level" required value={values.nursingLevel} onChange={update("nursingLevel")}>
              <option value="">Select a level</option>
              {NURSING_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </SelectField>
          </div>
        </Section>
      )}

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

export function AdminEmployeeCreate() {
  const navigate = useNavigate();

  async function handleCreate(input: EmployeeInput, login: NewEmployeeInput["login"]) {
    const created = await createEmployee({ ...input, login });
    navigate(`/admin/employees/${created.employeeId}`, { state: { message: "Employee created." } });
  }

  return (
    <AdminPage
      title="Add Employee"
      description="Create an employee record, an optional login account, and any doctor or nurse details."
      back={{ to: "/admin/employees", label: "Back to Employees" }}
    >
      <EmployeeForm cancelTo="/admin/employees" submitLabel="Create Employee" onSubmit={handleCreate} />
    </AdminPage>
  );
}

export function AdminEmployeeEdit() {
  const employeeId = parseEmployeeId(useParams().id);
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<AdminEmployeeDetails | null>(null);
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

  const detailsPath = employeeId ? `/admin/employees/${employeeId}` : "/admin/employees";

  async function handleSave(input: EmployeeInput) {
    if (employeeId === null) return;
    await updateEmployee(employeeId, input);
    navigate(detailsPath, { state: { message: "Changes saved." } });
  }

  return (
    <AdminPage
      title={employee ? `Edit ${employee.firstName} ${employee.lastName}` : "Edit Employee"}
      description="Update contact details, office, role, and license information."
      back={{ to: detailsPath, label: employeeId ? "Back to Employee" : "Back to Employees" }}
    >
      {loading && <p className="text-sm text-slate-600">Loading employee...</p>}
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {employee && <EmployeeForm employee={employee} cancelTo={detailsPath} submitLabel="Save Changes" onSubmit={handleSave} />}
    </AdminPage>
  );
}
