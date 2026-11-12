export function StatCard({ label, value, note, highlight = false }: { label: string; value: string; note?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-5 ${highlight ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${highlight ? "text-red-800" : "text-slate-500"}`}>{label}</p>
      <p className={`mt-2 text-3xl font-bold ${highlight ? "text-red-700" : "text-navy"}`}>{value}</p>
      {note && <p className="mt-1 text-xs text-slate-400">{note}</p>}
    </div>
  );
}
