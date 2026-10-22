import { useState } from "react";
import type { ButtonHTMLAttributes, FormEvent, ReactNode } from "react";
import { apiErrorMessage } from "../api";
import { ErrorText, Field } from "./FormControls";

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
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
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value || "Not provided"}</dd>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-green-100 text-green-800",
  Verified: "bg-green-100 text-green-800",
  Pending: "bg-yellow-100 text-yellow-800",
  Expired: "bg-red-100 text-red-800",
  Denied: "bg-red-100 text-red-800",
  Revoked: "bg-gray-200 text-gray-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function PrimaryButton({ className = "", ...props }: ButtonProps) {
  return (
    <button
      type="submit"
      {...props}
      className={`rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 ${className}`}
    />
  );
}

export function SecondaryButton({ className = "", ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={`rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 ${className}`}
    />
  );
}

export function TextButton({ danger = false, className = "", ...props }: ButtonProps & { danger?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={`text-sm font-medium ${danger ? "text-red-600 hover:text-red-700" : "text-blue-600 hover:text-blue-700"} disabled:opacity-60 ${className}`}
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
        <Field label="Current Password" type="password" required autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        <Field label="New Password" type="password" required minLength={8} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <Field label="Confirm New Password" type="password" required autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        <ErrorText message={error} />
        <SuccessText message={success} />
        <PrimaryButton disabled={saving}>{saving ? "Saving..." : "Update Password"}</PrimaryButton>
      </form>
    </Section>
  );
}

