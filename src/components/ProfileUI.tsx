import { useState } from "react";
import type { ButtonHTMLAttributes, FormEvent, ReactNode } from "react";
import { apiErrorMessage } from "../api";
import { ErrorText, PasswordField } from "./FormControls";
import { ADMIN_DANGER_BUTTON, ADMIN_PRIMARY_BUTTON, ADMIN_SECONDARY_BUTTON } from "./admin/styles";

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg shadow-box bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-navy">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function InfoGrid({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</dl>;
}

export function InfoItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value || "Not provided"}</dd>
    </div>
  );
}

// same badge look as the admin pages
const GREEN = "bg-green-50 text-green-700 ring-green-600/20";
const AMBER = "bg-amber-50 text-amber-700 ring-amber-600/20";
const RED = "bg-red-50 text-red-700 ring-red-600/20";
const BLUE = "bg-sky-50 text-sky-700 ring-sky-600/20";
const GRAY = "bg-slate-100 text-slate-600 ring-slate-500/20";

const STATUS_COLORS: Record<string, string> = {
  Active: GREEN,
  Verified: GREEN,
  Completed: GREEN,
  Approved: GREEN,
  Paid: GREEN,
  Received: GREEN,
  Pending: AMBER,
  Ordered: AMBER,
  Requested: AMBER,
  "Refund Requested": AMBER,
  Overdue: RED,
  Expired: RED,
  Denied: RED,
  "No Show": RED,
  Refunded: GRAY,
  Void: GRAY,
  Revoked: GRAY,
  Cancelled: GRAY,
  Inactive: GRAY,
  Scheduled: BLUE,
  InProgress: BLUE,
  "Checked In": BLUE,
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${STATUS_COLORS[status] ?? GRAY}`}>
      {status}
    </span>
  );
}

// exclamation mark in a circle
export function AlertIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

// a longer warning in a light slate box, with the exclamation mark first
export function WarningBox({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-start gap-2 rounded-lg border border-slate-400/30 bg-slate-500/10 px-4 py-3 text-sm text-slate-700 ${className}`}>
      <AlertIcon />
      <div>{children}</div>
    </div>
  );
}

// status as plain colored text (badges are only for tables)
export function StatusText({ status }: { status: string }) {
  const color = (STATUS_COLORS[status] ?? GRAY).split(" ").find((c) => c.startsWith("text-"));
  return <span className={`font-medium ${color}`}>{status}</span>;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({ className = "", ...props }: ButtonProps) {
  return <button type="submit" {...props} className={`${ADMIN_PRIMARY_BUTTON} ${className}`} />;
}

export function SecondaryButton({ className = "", ...props }: ButtonProps) {
  return <button type="button" {...props} className={`${ADMIN_SECONDARY_BUTTON} disabled:cursor-not-allowed disabled:opacity-60 ${className}`} />;
}

export function DangerButton({ className = "", ...props }: ButtonProps) {
  return <button type="button" {...props} className={`${ADMIN_DANGER_BUTTON} ${className}`} />;
}

export function TextButton({ danger = false, className = "", ...props }: ButtonProps & { danger?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={`text-sm font-medium ${danger ? "text-red-600 hover:text-red-700" : "text-navy hover:text-teal-700"} disabled:opacity-60 ${className}`}
    />
  );
}

export function FormActions({ saving, onCancel, saveLabel = "Save" }: { saving: boolean; onCancel: () => void; saveLabel?: string }) {
  return (
    <div className="flex gap-2">
      <PrimaryButton disabled={saving}>{saving ? "Saving..." : saveLabel}</PrimaryButton>
      <SecondaryButton onClick={onCancel} disabled={saving}>
        Cancel
      </SecondaryButton>
    </div>
  );
}

export function SuccessText({ message }: { message: string }) {
  return message ? <p className="text-sm text-green-700">{message}</p> : null;
}

export function ChangePasswordForm({ onSubmit }: { onSubmit: (body: { currentPassword: string; newPassword: string }) => Promise<unknown> }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from the current one");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password updated.");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title="Change Password">
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <PasswordField label="Current Password" required autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        <PasswordField label="New Password" required minLength={8} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <PasswordField label="Confirm New Password" required autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        <ErrorText message={error} />
        <SuccessText message={success} />
        <PrimaryButton disabled={saving}>{saving ? "Saving..." : "Update Password"}</PrimaryButton>
      </form>
    </Section>
  );
}

