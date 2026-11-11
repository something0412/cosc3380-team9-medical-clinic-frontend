import { useRef } from "react";
import { addDays, mondayOf, showDate, SLOT_STYLE } from "../../utils/weekCalendar";

// week arrows, the clickable date range with the browser date picker, and the color legend
export function WeekNav({
  weekStart,
  lastDay,
  from,
  to,
  firstWeek,
  lastWeek,
  onChange,
}: {
  weekStart: string;
  lastDay: string;
  from: string;
  to: string;
  firstWeek: string;
  lastWeek: string;
  onChange: (weekStart: string) => void;
}) {
  const datePicker = useRef<HTMLInputElement>(null);

  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Week of</p>
        <div className="mt-1 flex items-center gap-3">
          <button
            type="button"
            aria-label="Previous week"
            disabled={weekStart <= firstWeek}
            onClick={() => onChange(addDays(weekStart, -7))}
            className="rounded-lg bg-white p-1.5 text-slate-700 shadow-button hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => datePicker.current?.showPicker()}
              className="min-w-[240px] rounded-lg px-2 py-1 text-center text-lg font-semibold text-navy hover:bg-slate-100"
            >
              {showDate(weekStart)} - {showDate(lastDay)} ▾
            </button>
            {/* the same browser date picker the report filters use; picking a day jumps to its week */}
            <input
              ref={datePicker}
              type="date"
              tabIndex={-1}
              aria-hidden="true"
              min={from}
              max={to}
              value={weekStart < from ? from : weekStart}
              onChange={(e) => e.target.value && onChange(mondayOf(e.target.value))}
              className="pointer-events-none absolute bottom-0 left-0 h-0 w-full opacity-0"
            />
          </div>
          <button
            type="button"
            aria-label="Next week"
            disabled={weekStart >= lastWeek}
            onClick={() => onChange(addDays(weekStart, 7))}
            className="rounded-lg bg-white p-1.5 text-slate-700 shadow-button hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-slate-600">
        <span className={`rounded border-l-4 px-2 py-0.5 ${SLOT_STYLE.Scheduled}`}>Scheduled</span>
        <span className={`rounded border-l-4 px-2 py-0.5 ${SLOT_STYLE.Completed}`}>Completed</span>
        <span className={`rounded border-l-4 px-2 py-0.5 ${SLOT_STYLE["No Show"]}`}>No Show</span>
        <span className="px-1 py-0.5 text-slate-500">Blank = open</span>
      </div>
    </div>
  );
}
