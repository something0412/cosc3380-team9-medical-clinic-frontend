import { useState } from "react";
import type { ReactNode } from "react";
import { Field } from "../FormControls";

export interface Column<Row> {
  key: keyof Row & string;
  label: string;
  right?: boolean;
  render?: (row: Row) => ReactNode;
}

// a report table: click a header to sort, type in the box to search the listed columns
export function SortableTable<Row extends object>({
  columns,
  rows,
  searchKeys,
  searchPlaceholder,
  empty,
}: {
  columns: Column<Row>[];
  rows: Row[];
  searchKeys: (keyof Row & string)[];
  searchPlaceholder: string;
  empty: string;
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [ascending, setAscending] = useState(true);

  const query = search.trim().toLowerCase();
  const shown = rows.filter((row) => !query || searchKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(query)));

  // numbers sort as numbers, everything else as text, and empty values go last
  if (sortKey) {
    shown.sort((a, b) => {
      const x = (a as Record<string, unknown>)[sortKey];
      const y = (b as Record<string, unknown>)[sortKey];
      if (x == null) return 1;
      if (y == null) return -1;
      const order = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return ascending ? order : -order;
    });
  }

  function sortBy(key: string) {
    if (sortKey === key) setAscending(!ascending);
    else {
      setSortKey(key);
      setAscending(true);
    }
  }

  return (
    <div>
      <div className="mb-3 max-w-sm">
        <Field label="Search" type="search" placeholder={searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="-mx-5 overflow-x-auto border-t border-slate-200">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="whitespace-nowrap bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`px-4 py-3 ${c.right ? "text-right" : ""}`}>
                  <button type="button" onClick={() => sortBy(c.key)} className="uppercase hover:text-navy">
                    {c.label}
                    {sortKey === c.key ? (ascending ? " ▲" : " ▼") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">
                  {rows.length === 0 ? empty : "Nothing matches your search."}
                </td>
              </tr>
            ) : (
              shown.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  {columns.map((c) => (
                    <td key={c.key} className={`whitespace-nowrap px-4 py-3 text-slate-700 ${c.right ? "text-right" : ""}`}>
                      {c.render ? c.render(row) : String(row[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Showing {shown.length} of {rows.length}
      </p>
    </div>
  );
}
