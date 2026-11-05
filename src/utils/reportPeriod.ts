export type Period = "week" | "month" | "quarter" | "year" | "custom";

// a date as YYYY-MM-DD without time zone shifts
export function dateText(year: number, month: number, day: number) {
  const d = new Date(Date.UTC(year, month, day));
  return d.toISOString().slice(0, 10);
}

export function todayParts(day?: string) {
  const text = day ?? new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
  const [year, month, date] = text.split("-").map(Number);
  return { year, month: month - 1, date };
}

// the first and last day of the period that contains the given day (today when left out)
export function periodRange(period: Period, day?: string) {
  const { year, month, date } = todayParts(day);
  if (period === "week") {
    const weekday = new Date(Date.UTC(year, month, date)).getUTCDay();
    const monday = date - ((weekday + 6) % 7);
    return { from: dateText(year, month, monday), to: dateText(year, month, monday + 6) };
  }
  if (period === "month") return { from: dateText(year, month, 1), to: dateText(year, month + 1, 0) };
  if (period === "quarter") {
    const first = Math.floor(month / 3) * 3;
    return { from: dateText(year, first, 1), to: dateText(year, first + 3, 0) };
  }
  if (period === "year") return { from: dateText(year, 0, 1), to: dateText(year, 11, 31) };
  return { from: dateText(year, month, 1), to: dateText(year, month, date) };
}
