import type { ReactNode } from "react";
import { ADMIN_DANGER_BUTTON, ADMIN_SECONDARY_BUTTON } from "./styles";

interface StatusRowProps {
  label: string;
  status: ReactNode;
  note: string;
  showActions: boolean;
  children?: ReactNode;
}

// label, status badge, short note, and the actions for that status
export function StatusRow({ label, status, note, showActions, children }: StatusRowProps) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          {status}
        </div>
        <p className="mt-1 text-sm text-slate-500">{note}</p>
      </div>
      {showActions && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

interface ConfirmPanelProps {
  text: string;
  confirmLabel: string;
  saving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmPanel({ text, confirmLabel, saving, onConfirm, onCancel }: ConfirmPanelProps) {
  return (
    <div role="alertdialog" aria-label={confirmLabel} className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm text-amber-900">{text}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onConfirm} disabled={saving} className={ADMIN_DANGER_BUTTON}>
          {saving ? "Saving..." : confirmLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} className={ADMIN_SECONDARY_BUTTON}>
          Cancel
        </button>
      </div>
    </div>
  );
}
