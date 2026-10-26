import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { CLINIC_TIME_ZONE } from "../utils/clinicTime";

// a report that only shows when printing, with the clinic heading on top
// only one report can be on a page at a time, and utils/printReport.ts opens the print window
export function PrintReport({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const printedAt = new Date().toLocaleString("en-US", { timeZone: CLINIC_TIME_ZONE, dateStyle: "medium", timeStyle: "short" });

  return createPortal(
    <div id="print-root" className="bg-white p-6 text-sm text-slate-900">
      <header className="mb-6 flex items-end justify-between gap-4 border-b-2 border-navy pb-3">
        <div>
          <p className="font-heading text-2xl text-navy">Medical Clinic</p>
          <h1 className="mt-1 text-lg font-semibold">{title}</h1>
          {subtitle && <p className="text-slate-600">{subtitle}</p>}
        </div>
        <p className="text-xs text-slate-500">Printed {printedAt}</p>
      </header>
      {children}
    </div>,
    document.body
  );
}

// a titled block inside a report
export function ReportSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-5 break-inside-avoid">
      <h2 className="mb-2 border-b border-slate-300 pb-1 text-xs font-semibold uppercase tracking-wide text-navy">{title}</h2>
      {children}
    </section>
  );
}

// a simple table inside a report, columns listed in alignRight line up on the right (for money and counts)
export function ReportTable({ headers, rows, alignRight = [] }: { headers: string[]; rows: ReactNode[][]; alignRight?: number[] }) {
  const align = (column: number) => (alignRight.includes(column) ? "text-right" : "text-left");

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-slate-300 text-xs text-slate-500">
          {headers.map((header, column) => (
            <th key={header} className={`py-1.5 pr-3 font-medium ${align(column)}`}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} className="border-b border-slate-100">
            {row.map((cell, column) => (
              <td key={column} className={`py-1.5 pr-3 align-top ${align(column)}`}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
