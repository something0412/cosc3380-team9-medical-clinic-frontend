import type { ReactNode } from "react";

const TONES = {
  green: "bg-green-50 text-green-700 ring-green-600/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  gray: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

function Badge({ tone, children }: { tone: keyof typeof TONES; children: ReactNode }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return isActive ? <Badge tone="green">Active</Badge> : <Badge tone="gray">Inactive</Badge>;
}

export function LoginStatusBadge({ hasLogin, loginActive }: { hasLogin: boolean; loginActive: boolean | null }) {
  if (!hasLogin) return <Badge tone="gray">No login</Badge>;
  return loginActive ? <Badge tone="green">Enabled</Badge> : <Badge tone="amber">Disabled</Badge>;
}
