import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { EYEBROW } from "./public/shared";

interface PortalPageProps {
  eyebrow: string;
  title: string;
  description?: string;
  back?: { to: string; label: string };
  actions?: ReactNode;
  children: ReactNode;
}

// shared heading and content width for every portal page (same look as the admin pages)
export function PortalPage({ eyebrow, title, description, back, actions, children }: PortalPageProps) {
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
            <p className={EYEBROW}>{eyebrow}</p>
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

// red box for a page that couldn't load
export function PageError({ message }: { message: string }) {
  return message ? (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </p>
  ) : null;
}
