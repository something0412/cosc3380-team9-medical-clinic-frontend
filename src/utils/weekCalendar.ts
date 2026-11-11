// date and time helpers for the schedule utilization week calendars

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// colors for a booked slot by its status
export const SLOT_STYLE: Record<string, string> = {
  Scheduled: "border-blue-400 bg-blue-50 text-blue-900",
  Completed: "border-green-500 bg-green-50 text-green-900",
  "No Show": "border-red-400 bg-red-50 text-red-900",
};

// 14:30 -> 870 minutes after midnight
export function minutes(time: string) {
  const [h, m] = time.split(":");
  return Number(h) * 60 + Number(m);
}

// YYYY-MM-DD plus some days
export function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// the Monday of the week a date falls in
export function mondayOf(date: string) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return addDays(date, day === 0 ? -6 : 1 - day);
}

// 2026-11-02 -> Nov 2, 2026
export function showDate(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

// 14:30 -> 2:30 PM
export function showTime(value: string) {
  const [hour, minute] = value.split(":");
  const h = Number(hour);
  return `${h % 12 || 12}:${minute} ${h >= 12 ? "PM" : "AM"}`;
}

// today's date at the clinic as YYYY-MM-DD
export function clinicToday() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
}

// booked out of offered as a percent
export function percent(booked: number, offered: number) {
  return offered ? `${Math.round((1000 * booked) / offered) / 10}%` : "N/A";
}
