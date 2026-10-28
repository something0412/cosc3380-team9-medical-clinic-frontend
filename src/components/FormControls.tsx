import { useState } from "react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { ID_LENGTH } from "../utils/id";

export function Field({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        {...props}
        className="w-full rounded-lg bg-white px-3 py-2 text-sm shadow-field focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}

// password with an eye button to show or hide what's typed
export function PasswordField({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <span className="relative block">
        <input
          {...props}
          type={showPassword ? "text" : "password"}
          className="w-full rounded-lg bg-white py-2 pl-3 pr-10 text-sm shadow-field focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          title={showPassword ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500 hover:text-navy"
        >
          {showPassword ? (
            // eye with a line through it
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
              <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
              <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
              <path d="m2 2 20 20" />
            </svg>
          ) : (
            // eye
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </span>
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

// phone number: digits only, exactly 10
// pattern stops the form from submitting until it's 10 digits
export function PhoneField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const hasNonDigits = /\D/.test(value);
  return (
    <div>
      <Field
        label={label}
        type="tel"
        inputMode="numeric"
        placeholder="7135550100"
        maxLength={10}
        pattern="[0-9]{10}"
        title="Enter a 10-digit phone number (numbers only)"
        required
        aria-invalid={hasNonDigits}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hasNonDigits && <p className="mt-1 text-xs text-red-600">This field only takes numbers (0-9).</p>}
    </div>
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
      className="w-full rounded-lg bg-navy py-2.5 text-sm font-semibold text-white shadow-button hover:bg-navy-dark disabled:opacity-60"
    >
      {submitting ? "Please wait..." : label}
    </button>
  );
}

export function SelectField({ label, children, ...props }: { label: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <select
        {...props}
        className="w-full rounded-lg bg-white px-3 py-2 text-sm shadow-field focus:outline-none"
      >
        {children}
      </select>
    </label>
  );
}
