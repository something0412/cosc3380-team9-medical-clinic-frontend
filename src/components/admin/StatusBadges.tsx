import type { ReactNode } from "react";

const TONES = {
  green: "bg-green-50 text-green-700 ring-green-600/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  gray: "bg-slate-100 text-slate-600 ring-slate-500/20",
  teal: "bg-teal-50 text-teal-700 ring-teal-600/20",
};

// a pill inside tables, or plain colored text everywhere else
function Badge({ tone, plain = false, children }: { tone: keyof typeof TONES; plain?: boolean; children: ReactNode }) {
  if (plain) {
    const color = TONES[tone].split(" ").find((c) => c.startsWith("text-"));
    return <span className={`font-medium ${color}`}>{children}</span>;
  }
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function ActiveBadge({ isActive, plain }: { isActive: boolean; plain?: boolean }) {
  return isActive ? <Badge tone="green" plain={plain}>Active</Badge> : <Badge tone="gray" plain={plain}>Inactive</Badge>;
}

export function ReferralBadge({ requiresReferral, plain }: { requiresReferral: boolean; plain?: boolean }) {
  return requiresReferral ? <Badge tone="teal" plain={plain}>Referral required</Badge> : <Badge tone="gray" plain={plain}>No referral</Badge>;
}

export function LoginStatusBadge({ hasLogin, loginActive, plain }: { hasLogin: boolean; loginActive: boolean | null; plain?: boolean }) {
  if (!hasLogin) return <Badge tone="gray" plain={plain}>No login</Badge>;
  return loginActive ? <Badge tone="green" plain={plain}>Enabled</Badge> : <Badge tone="amber" plain={plain}>Disabled</Badge>;
}
