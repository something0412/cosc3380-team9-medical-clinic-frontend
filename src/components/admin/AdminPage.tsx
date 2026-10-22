import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { EYEBROW } from "../public/shared";

interface AdminPageProps {
  title: string;
  description?: string;
  back?: { to: string; label: string };
  actions?: ReactNode;
  children: ReactNode;
}

// shared heading and content width for admin pages
export function AdminPage({ title, description, back, actions, children }: AdminPageProps) {
  return (
    // inline-size containment keeps wide tables scrolling inside the page instead of widening the layout
    <div className="mx-auto w-full max-w-6xl space-y-6 [contain:inline-size]">
      <header className="border-b border-slate-200 pb-5">
        {back && (
          <Link to={back.to} className="mb-3 inline-block text-sm font-medium text-slate-600 hover:text-navy">
            ← {back.label}
          </Link>
        )}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={EYEBROW}>Administration</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy">{title}</h1>
            {description && <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      </header>
      {children}
    </div>
  );
}
