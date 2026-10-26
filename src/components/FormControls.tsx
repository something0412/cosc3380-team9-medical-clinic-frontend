import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { ID_LENGTH } from "../utils/id";

export function Field({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
      />
    </label>
  );
}

export function IdField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field
      label={label}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="00000000"
      maxLength={ID_LENGTH}
      required
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
    />
  );
}

export function ErrorText({ message }: { message: string }) {
  return message ? <p className="text-sm text-red-600">{message}</p> : null;
}

export function SubmitButton({ submitting, label }: { submitting: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
    >
      {submitting ? "Please wait..." : label}
    </button>
  );
}

export function SelectField({ label, children, ...props }: { label: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <select
        {...props}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {children}
      </select>
    </label>
  );
}
