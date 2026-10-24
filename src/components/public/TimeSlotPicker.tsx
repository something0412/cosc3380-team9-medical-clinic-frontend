import type { ReactNode } from "react";
import { ArrowIcon } from "./icons";
import { FOCUS, TEXT_LINK } from "./shared";
import { isSameSlot } from "../../services/bookingApi";
import type { AvailableSlot, SlotChoice } from "../../services/bookingApi";
import { formatDate, formatDateRange, formatTime } from "../../utils/clinicTime";

interface TimeSlotPickerProps {
  // the dates to show, usually one week
  days: string[];
  // open times for those dates, or null while they load
  slots: AvailableSlot[] | null;
  // the day whose times are listed
  viewedDay: string | null;
  onViewDay: (date: string) => void;
  selected: SlotChoice | null;
  onSelect: (slot: AvailableSlot) => void;
  // left out when there's no earlier or later week to show
  onPreviousWeek?: () => void;
  onNextWeek?: () => void;
  // shown in place of the times, for errors and empty weeks
  message?: ReactNode;
}

const WEEK_BUTTON = `${TEXT_LINK} text-sm disabled:cursor-not-allowed disabled:text-slate-300`;

// a row of days with their open times, then the times for one day grouped by doctor and location
export function TimeSlotPicker({ days, slots, viewedDay, onViewDay, selected, onSelect, onPreviousWeek, onNextWeek, message }: TimeSlotPickerProps) {
  const counts = new Map<string, number>();
  for (const slot of slots ?? []) counts.set(slot.date, (counts.get(slot.date) ?? 0) + 1);
  const daySlots = (slots ?? []).filter((slot) => slot.date === viewedDay);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="text-lg font-semibold text-navy">{formatDateRange(days[0], days[days.length - 1])}</p>
          <p className="text-sm text-slate-500">All times are Central Time.</p>
        </div>
        <div className="flex gap-6">
          <button type="button" onClick={onPreviousWeek} disabled={!onPreviousWeek} className={WEEK_BUTTON}>
            <ArrowIcon className="h-4 w-4 rotate-180" />
            Previous week
          </button>
          <button type="button" onClick={onNextWeek} disabled={!onNextWeek} className={WEEK_BUTTON}>
            Next week
            <ArrowIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {message ? "" : slots === null ? "Loading open times" : `${slots.length} open ${slots.length === 1 ? "time" : "times"} this week`}
      </p>

      <div role="group" aria-label="Days" className="mt-5 grid grid-cols-7 border-b border-slate-200">
        {days.map((date) => {
          const count = counts.get(date) ?? 0;
          const viewed = date === viewedDay;
          const summary = slots === null ? "" : count === 0 ? "No times" : `${count} ${count === 1 ? "time" : "times"}`;
          return (
            <button
              key={date}
              type="button"
              onClick={() => onViewDay(date)}
              disabled={count === 0}
              aria-pressed={viewed}
              aria-label={`${formatDate(date, { weekday: "long", month: "long", day: "numeric" })}, ${summary || "loading"}`}
              className={`-mb-px rounded-t border-b-2 px-1 pt-1 pb-3 text-center transition-colors disabled:cursor-default ${FOCUS} ${
                viewed
                  ? "border-teal-600 text-navy"
                  : count > 0
                    ? "border-transparent text-slate-700 hover:border-slate-300 hover:text-navy"
                    : "border-transparent text-slate-400"
              }`}
            >
              <span className="block text-xs font-semibold tracking-wide uppercase">{formatDate(date, { weekday: "short" })}</span>
              <span className="mt-1 block text-xl font-semibold">{formatDate(date, { day: "numeric" })}</span>
              <span className="mt-0.5 hidden h-5 text-xs sm:block">{summary}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {message ??
          (slots === null ? (
            <p className="text-slate-600">Loading open times...</p>
          ) : viewedDay && daySlots.length > 0 ? (
            <DayTimes date={viewedDay} slots={daySlots} selected={selected} onSelect={onSelect} />
          ) : null)}
      </div>
    </div>
  );
}

function DayTimes({ date, slots, selected, onSelect }: { date: string; slots: AvailableSlot[]; selected: SlotChoice | null; onSelect: (slot: AvailableSlot) => void }) {
  // one group per doctor and location, in the order the API sorts them (earliest time first)
  const groups: { key: string; doctorName: string; officeName: string; slots: AvailableSlot[] }[] = [];
  for (const slot of slots) {
    const key = `${slot.doctorId}-${slot.officeId}`;
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, doctorName: slot.doctorName, officeName: slot.officeName, slots: [] };
      groups.push(group);
    }
    group.slots.push(slot);
  }

  return (
    <fieldset>
      <legend className="font-semibold text-navy">{formatDate(date, { weekday: "long", month: "long", day: "numeric" })}</legend>
      <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
        {groups.map((group) => (
          <li key={group.key} className="grid gap-3 py-5 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:gap-6">
            <div>
              <p className="font-semibold text-navy">Dr. {group.doctorName}</p>
              <p className="text-sm text-slate-600">{group.officeName}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {group.slots.map((slot) => (
                <label key={slot.timeSlotId}>
                  <input
                    type="radio"
                    name="appointment-time"
                    checked={!!selected && isSameSlot(slot, selected)}
                    onChange={() => onSelect(slot)}
                    aria-label={`${formatTime(slot.startTime)} with Dr. ${slot.doctorName} at ${slot.officeName}`}
                    className="peer sr-only"
                  />
                  <span className="inline-flex min-w-[6.5rem] cursor-pointer justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-navy transition-colors hover:border-navy peer-checked:border-navy peer-checked:bg-navy peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal-600">
                    {formatTime(slot.startTime)}
                  </span>
                </label>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
