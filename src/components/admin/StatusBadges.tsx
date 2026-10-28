import type { ReactNode } from "react";

const TONES = {
  green: "text-green-700",
  amber: "text-amber-700",
  gray: "text-slate-600",
  teal: "text-teal-700",
};

// a pill inside tables, or plain colored text everywhere else
function Badge({ tone, plain = false, children }: { tone: keyof typeof TONES; plain?: boolean; children: ReactNode }) {
  if (plain) {
    const color = TONES[tone].split(" ").find((c) => c.startsWith("text-"));
    return <span className={`font-medium ${color}`}>{children}</span>;
  }
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium shadow-pill ${TONES[tone]}`}>
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
