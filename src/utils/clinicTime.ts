// appointment times use the clinic's time zone, the same one the backend uses
export const CLINIC_TIME_ZONE = "America/Chicago";

// the current date and time at the clinic, as YYYY-MM-DD and HH:MM
export function clinicNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CLINIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return { date: `${part("year")}-${part("month")}-${part("day")}`, time: `${part("hour")}:${part("minute")}` };
}

export function clinicToday() {
  return clinicNow().date;
}

// whether a clinic date and start time are already here
export function hasStarted(date: string, time: string) {
  const now = clinicNow();
  return `${date} ${time}` <= `${now.date} ${now.time}`;
}

// calendar dates are read at UTC midnight so the browser's own time zone never shifts them
function toDate(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

export function addDays(date: string, days: number) {
  const next = toDate(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

// a real calendar date written as YYYY-MM-DD, without year 0 since PostgreSQL has none
export function isDate(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !value.startsWith("0000") && toDate(value).toISOString().startsWith(value);
}

export function formatDate(date: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(toDate(date));
}

// "October 23 to 29, 2026", naming the month and year again only when they change
export function formatDateRange(start: string, end: string) {
  const month = (date: string) => formatDate(date, { month: "long" });
  const day = (date: string) => Number(date.slice(8, 10));
  const year = (date: string) => date.slice(0, 4);
  if (year(start) !== year(end)) return `${month(start)} ${day(start)}, ${year(start)} to ${month(end)} ${day(end)}, ${year(end)}`;
  if (month(start) !== month(end)) return `${month(start)} ${day(start)} to ${month(end)} ${day(end)}, ${year(end)}`;
  return `${month(start)} ${day(start)} to ${day(end)}, ${year(end)}`;
}

// "13:30" as "1:30 PM"
export function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
}
