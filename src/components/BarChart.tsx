import { CHART_COLORS } from "../utils/chartColors";

interface BarChartProps {
  labels: string[];
  series: { name: string; values: number[] }[];
  formatValue?: (value: number) => string;
  height?: number;
  showValues?: boolean;
}

// bar chart
export function BarChart({ labels, series, formatValue = (v) => String(v), height = 220, showValues = false }: BarChartProps) {
  // axis steps
  const rawStep = Math.max(1, ...series.flatMap((s) => s.values)) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = Math.max(1, [1, 2, 5, 10].map((n) => n * magnitude).find((n) => n >= rawStep) ?? rawStep);
  const max = step * 4;
  const ticks = [4, 3, 2, 1, 0].map((t) => step * t);

  return (
    <div>
      {series.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-4 text-sm text-gray-600">
          {series.map((s, i) => (
            <span key={s.name} className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: CHART_COLORS[i] }} />
              {s.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex flex-col justify-between pb-6 text-right text-xs text-gray-400" style={{ height }}>
          {ticks.map((t, i) => (
            <span key={i} className="-translate-y-1/2 leading-none">{formatValue(Math.round(t))}</span>
          ))}
        </div>

        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col justify-between" style={{ height: height - 24 }}>
            {ticks.map((_, i) => (
              <div key={i} className={`border-t ${i === ticks.length - 1 ? "border-gray-300" : "border-gray-100"}`} />
            ))}
          </div>

          <div className="relative flex" style={{ height }}>
            {labels.map((label, li) => (
              <div key={label} className="group relative flex flex-1 flex-col items-center">
                <div className="flex w-full flex-1 items-end justify-center gap-0.5 px-1">
                  {series.map((s, si) => (
                    <div
                      key={s.name}
                      className="relative w-full max-w-8 rounded-t transition-opacity group-hover:opacity-80"
                      style={{ height: `${(s.values[li] / max) * 100}%`, backgroundColor: CHART_COLORS[si] }}
                      aria-label={`${label} ${s.name}: ${formatValue(s.values[li])}`}
                    >
                      {showValues && (
                        <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 text-xs font-medium text-gray-700">
                          {formatValue(s.values[li])}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <span className="mt-1 h-5 text-xs text-gray-500">{label}</span>

                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                  <p className="font-medium">{label}</p>
                  {series.map((s, si) => (
                    <p key={s.name} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: CHART_COLORS[si] }} />
                      {s.name}: {formatValue(s.values[li])}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
