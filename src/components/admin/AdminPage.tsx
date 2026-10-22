import type { ReactNode } from "react";
import { EYEBROW } from "../public/shared";

// shared heading and content width for admin pages
export function AdminPage({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <p className={EYEBROW}>Administration</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>}
      </header>
      {children}
    </div>
  );
}
