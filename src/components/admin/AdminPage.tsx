import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { EYEBROW } from "../public/shared";

interface AdminPageProps {
  title: string;
  description?: string;
  back?: { to: string; label: string };
  children: ReactNode;
}

// shared heading and content width for admin pages
export function AdminPage({ title, description, back, children }: AdminPageProps) {
  return (
    // inline-size containment keeps wide tables scrolling inside the page instead of widening the layout
    <div className="mx-auto w-full max-w-6xl space-y-6 [contain:inline-size]">
      <header className="border-b border-slate-200 pb-5">
        {back && (
          <Link to={back.to} className="mb-3 inline-block text-sm font-medium text-slate-600 hover:text-navy">
            ← {back.label}
          </Link>
        )}
        <p className={EYEBROW}>Administration</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>}
      </header>
      {children}
    </div>
  );
}
