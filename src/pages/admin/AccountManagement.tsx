import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { apiErrorMessage } from "../../api";
import { ActiveBadge, LoginStatusBadge } from "../../components/admin/StatusBadges";
import { ConfirmPanel, StatusRow } from "../../components/admin/StatusControls";
import { ADMIN_DANGER_BUTTON, ADMIN_PRIMARY_BUTTON, ADMIN_SECONDARY_BUTTON } from "../../components/admin/styles";
import { Field } from "../../components/FormControls";
import { Section } from "../../components/ProfileUI";
import { useAuth } from "../../context/AuthContext";
import { createEmployeeLogin, resetEmployeePassword, setEmployeeStatus, setLoginStatus } from "../../services/adminApi";
import type { AdminEmployeeDetails } from "../../services/adminApi";

type Panel = "deactivate" | "disable-login" | "reset-password" | "create-login" | null;

// employee status, login access, and passwords for one employee
export function AccountManagement({ employee, onChange }: { employee: AdminEmployeeDetails; onChange: () => Promise<void> }) {
  const { user } = useAuth();
  const isSelf = user?.id === employee.employeeId;
  const id = employee.employeeId;

  const [panel, setPanel] = useState<Panel>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // blocks a second request before the disabled buttons re-render
  const busy = useRef(false);

  function openPanel(next: Panel) {
    setPanel(next);
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
  }

  async function run(action: () => Promise<unknown>, message: string) {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await action();
      openPanel(null);
      await onChange();
      setSuccess(message);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  function submitPassword(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (panel === "create-login") {
      run(() => createEmployeeLogin(id, { username, password }), "Login created.");
    } else {
      run(() => resetEmployeePassword(id, password), "Password reset.");
    }
  }

  const name = `${employee.firstName} ${employee.lastName}`;

  return (
    <Section title="Account Management">
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

      <div className="divide-y divide-slate-200">
        <div>
          <StatusRow
            label="Employee Status"
            status={<ActiveBadge isActive={employee.isActive} />}
            showActions={panel === null}
            note={
              isSelf && employee.isActive
                ? "You can't deactivate your own account."
                : "Inactive employees can't sign in, even if their login is enabled."
            }
          >
            {employee.isActive
              ? !isSelf && (
                  <button type="button" onClick={() => openPanel("deactivate")} disabled={saving} className={ADMIN_DANGER_BUTTON}>
                    Deactivate Employee
                  </button>
                )
              : (
                  <button type="button" onClick={() => run(() => setEmployeeStatus(id, true), "Employee activated.")} disabled={saving} className={ADMIN_PRIMARY_BUTTON}>
                    Activate Employee
                  </button>
                )}
          </StatusRow>
          {panel === "deactivate" && (
            <ConfirmPanel
              text={`Deactivate ${name}? They won't be able to sign in until they're activated again. Their records are kept.`}
              confirmLabel="Deactivate Employee"
              saving={saving}
              onConfirm={() => run(() => setEmployeeStatus(id, false), "Employee deactivated.")}
              onCancel={() => openPanel(null)}
            />
          )}
        </div>

        <div>
          <StatusRow
            label="Login Access"
            status={<LoginStatusBadge hasLogin={employee.hasLogin} loginActive={employee.loginActive} />}
            showActions={panel === null}
            note={
              !employee.hasLogin
                ? "This employee can't sign in until a login is created."
                : !employee.loginActive && !employee.isActive
                  ? "Activate the employee before enabling their login."
                  : isSelf && employee.loginActive
                    ? "You can't disable your own login."
                    : `Login created ${employee.loginCreatedDate}.`
            }
          >
            {employee.hasLogin ? (
              <>
                {employee.loginActive && !isSelf && (
                  <button type="button" onClick={() => openPanel("disable-login")} disabled={saving} className={ADMIN_DANGER_BUTTON}>
                    Disable Login
                  </button>
                )}
                {!employee.loginActive && employee.isActive && (
                  <button type="button" onClick={() => run(() => setLoginStatus(id, true), "Login enabled.")} disabled={saving} className={ADMIN_PRIMARY_BUTTON}>
                    Enable Login
                  </button>
                )}
                <button type="button" onClick={() => openPanel("reset-password")} disabled={saving} className={ADMIN_SECONDARY_BUTTON}>
                  Reset Password
                </button>
              </>
            ) : (
              <button type="button" onClick={() => openPanel("create-login")} disabled={saving} className={ADMIN_PRIMARY_BUTTON}>
                Create Login
              </button>
            )}
          </StatusRow>

          {panel === "disable-login" && (
            <ConfirmPanel
              text={`Disable login for ${name}? They won't be able to sign in until their login is enabled again.`}
              confirmLabel="Disable Login"
              saving={saving}
              onConfirm={() => run(() => setLoginStatus(id, false), "Login disabled.")}
              onCancel={() => openPanel(null)}
            />
          )}

          {(panel === "reset-password" || panel === "create-login") && (
            <form onSubmit={submitPassword} className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">{panel === "create-login" ? "Create Login" : "Reset Password"}</p>
              <p className="mt-1 text-sm text-slate-500">
                {panel === "create-login"
                  ? "Staff sign in with their staff ID and this password."
                  : "The new password replaces the current one. Login access is not changed."}
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {panel === "create-login" && (
                  <Field label="Username" required maxLength={50} autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} />
                )}
                <Field
                  label="New Password"
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Field
                  label="Confirm Password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="submit" disabled={saving} className={ADMIN_PRIMARY_BUTTON}>
                  {saving ? "Saving..." : panel === "create-login" ? "Create Login" : "Save Password"}
                </button>
                <button type="button" onClick={() => openPanel(null)} disabled={saving} className={ADMIN_SECONDARY_BUTTON}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Section>
  );
}
