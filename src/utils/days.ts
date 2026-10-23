const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// days in calendar order, with a full work week shortened
export function formatDays(days: string[]) {
  const ordered = WEEK.filter((day) => days.includes(day));
  if (ordered.join() === WEEK.slice(0, 5).join()) return "Monday to Friday";
  return ordered.join(", ");
}
