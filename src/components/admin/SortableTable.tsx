import { useState } from "react";
import type { ReactNode } from "react";
import { Field } from "../FormControls";

export interface Column<Row> {
  key: keyof Row & string;
  label: string;
  right?: boolean;
  // for button columns that shouldn't sort
  noSort?: boolean;
  render?: (row: Row) => ReactNode;
}

// a report table: click a header to sort, type in the box to search the listed columns
export function SortableTable<Row extends object>({
  columns,
  rows,
  searchKeys,
  searchPlaceholder,
  empty,
  pageSize,
}: {
  columns: Column<Row>[];
  rows: Row[];
  searchKeys: (keyof Row & string)[];
  searchPlaceholder: string;
  empty: string;
  // rows per page; leave it out to show every row
  pageSize?: number;
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [ascending, setAscending] = useState(true);
  const [page, setPage] = useState(1);

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

  // the rows on the current page (a page past the end goes back to the last page)
  const pageCount = pageSize ? Math.max(1, Math.ceil(shown.length / pageSize)) : 1;
  const currentPage = Math.min(page, pageCount);
  const first = pageSize ? (currentPage - 1) * pageSize : 0;
  const pageRows = pageSize ? shown.slice(first, first + pageSize) : shown;

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
        <Field label="Search" type="search" placeholder={searchPlaceholder} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>
      <div className="-mx-5 overflow-x-auto border-t border-slate-200">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`px-3 py-3 align-bottom ${c.right ? "text-right" : ""}`}>
                  {c.noSort ? (
                    <span className="sr-only">{c.label}</span>
                  ) : (
                    <button type="button" onClick={() => sortBy(c.key)} className={`uppercase hover:text-navy ${c.right ? "text-right" : "text-left"}`}>
                      {c.label}
                      {sortKey === c.key ? (ascending ? " ▲" : " ▼") : ""}
                    </button>
                  )}
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
              pageRows.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  {columns.map((c) => (
                    <td key={c.key} className={`whitespace-nowrap px-3 py-3 text-slate-700 ${c.right ? "text-right" : ""}`}>
                      {c.render ? c.render(row) : String(row[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          {pageSize && shown.length > 0
            ? `Showing ${first + 1}-${first + pageRows.length} of ${shown.length}`
            : `Showing ${shown.length} of ${rows.length}`}
        </p>
        {pageCount > 1 && (
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
              className="rounded-lg bg-white px-3 py-1 text-slate-700 shadow-button hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-slate-600">
              Page {currentPage} of {pageCount}
            </span>
            <button
              type="button"
              disabled={currentPage === pageCount}
              onClick={() => setPage(currentPage + 1)}
              className="rounded-lg bg-white px-3 py-1 text-slate-700 shadow-button hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
