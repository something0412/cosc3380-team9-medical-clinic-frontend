import { Field, SelectField } from "../FormControls";
import { dateText, periodRange, todayParts } from "../../utils/reportPeriod";
import type { Period } from "../../utils/reportPeriod";

const thisYear = todayParts().year;
const YEARS = [thisYear + 1, thisYear, thisYear - 1, thisYear - 2, thisYear - 3];

// weekly, monthly, quarterly, yearly or a custom range, always reported as from and to dates
export function ReportPeriod({
  period,
  from,
  to,
  onChange,
}: {
  period: Period;
  from: string;
  to: string;
  onChange: (period: Period, from: string, to: string) => void;
}) {
  const { year, month } = todayParts(from);
  const quarter = Math.floor(month / 3) + 1;
  const pick = (next: Period, day?: string) => {
    const range = periodRange(next, day);
    onChange(next, range.from, range.to);
  };

  return (
    <>
      {/* switching the period type starts at the current week, month, quarter or year */}
      <SelectField label="Time period" value={period} onChange={(e) => pick(e.target.value as Period)}>
        <option value="week">Weekly</option>
        <option value="month">Monthly</option>
        <option value="quarter">Quarterly</option>
        <option value="year">Yearly</option>
        <option value="custom">Custom range</option>
      </SelectField>

      {period === "week" && <Field label="Week of" type="date" required value={from} onChange={(e) => e.target.value && pick("week", e.target.value)} />}

      {period === "month" && (
        <Field
          label="Month"
          type="month"
          required
          value={from.slice(0, 7)}
          onChange={(e) => e.target.value && pick("month", `${e.target.value}-01`)}
        />
      )}

      {period === "quarter" && (
        <div className="grid grid-cols-2 gap-2">
          <SelectField label="Quarter" value={quarter} onChange={(e) => pick("quarter", dateText(year, (Number(e.target.value) - 1) * 3, 1))}>
            <option value={1}>Q1</option>
            <option value={2}>Q2</option>
            <option value={3}>Q3</option>
            <option value={4}>Q4</option>
          </SelectField>
          <SelectField label="Year" value={year} onChange={(e) => pick("quarter", dateText(Number(e.target.value), (quarter - 1) * 3, 1))}>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </SelectField>
        </div>
      )}

      {period === "year" && (
        <SelectField label="Year" value={year} onChange={(e) => pick("year", dateText(Number(e.target.value), 0, 1))}>
          {YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </SelectField>
      )}

      {period === "custom" && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="From" type="date" required value={from} onChange={(e) => e.target.value && onChange("custom", e.target.value, to)} />
          <Field label="To" type="date" required value={to} onChange={(e) => e.target.value && onChange("custom", from, e.target.value)} />
        </div>
      )}
    </>
  );
}
