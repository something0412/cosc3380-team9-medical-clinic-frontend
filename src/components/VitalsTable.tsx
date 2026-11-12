import { NotAvailable } from "./ProfileUI";
import { bloodPressureFlag, breathingFlag, FLAG_STYLE, heartRateFlag, oxygenFlag, temperatureFlag } from "../utils/vitalsFlags";
import type { Flag } from "../utils/vitalsFlags";

export interface Vitals {
  vitalsId: number;
  appointmentId: number | null;
  recordedAt: string;
  recordedBy: string;
  temperature: number | null;
  heartRate: number | null;
  systolic: number | null;
  diastolic: number | null;
  respiratoryRate: number | null;
  oxygenSaturation: number | null;
  weight: number | null;
  height: number | null;
}

const cell = (flag: Flag) => `px-4 py-3 ${flag ? FLAG_STYLE[flag] : "text-slate-700"}`;

// red banner when the newest reading has a critical value
export function CriticalVitalsBanner({ vitals, note }: { vitals: Vitals[]; note?: string }) {
  const latest = vitals[0];
  if (!latest) return null;

  const readings: string[] = [];
  if (temperatureFlag(latest) === "critical") readings.push(`Temperature ${latest.temperature}°F`);
  if (heartRateFlag(latest) === "critical") readings.push(`Heart rate ${latest.heartRate} bpm`);
  if (bloodPressureFlag(latest) === "critical") readings.push(`Blood pressure ${latest.systolic}/${latest.diastolic}`);
  if (breathingFlag(latest) === "critical") readings.push(`Breathing ${latest.respiratoryRate}/min`);
  if (oxygenFlag(latest) === "critical") readings.push(`Oxygen ${latest.oxygenSaturation}%`);
  if (readings.length === 0) return null;

  return (
    <div role="alert" className="rounded-lg border-2 border-red-500 bg-red-50 p-4 text-red-900">
      <p className="text-lg font-bold">Critical vitals{note ? `: ${note}` : ""}</p>
      <p className="mt-1">{readings.join(" · ")}</p>
      <p className="mt-1 text-sm">Recorded {latest.recordedAt} by {latest.recordedBy}</p>
    </div>
  );
}

// vitals table with critical and abnormal readings colored
export function VitalsTable({ vitals, empty }: { vitals: Vitals[]; empty: string }) {
  if (vitals.length === 0) return <p className="text-slate-500">{empty}</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Recorded</th>
            <th className="px-4 py-3">Temp (°F)</th>
            <th className="px-4 py-3">Heart Rate</th>
            <th className="px-4 py-3">Blood Pressure</th>
            <th className="px-4 py-3">Breathing</th>
            <th className="px-4 py-3">Oxygen</th>
            <th className="px-4 py-3">Weight (lb)</th>
            <th className="px-4 py-3">Height (in)</th>
            <th className="px-4 py-3">By</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {vitals.map((v) => (
            <tr key={v.vitalsId}>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{v.recordedAt}</td>
              <td className={cell(temperatureFlag(v))}>{v.temperature ?? <NotAvailable />}</td>
              <td className={cell(heartRateFlag(v))}>{v.heartRate ?? <NotAvailable />}</td>
              <td className={cell(bloodPressureFlag(v))}>{v.systolic || v.diastolic ? `${v.systolic ?? "?"}/${v.diastolic ?? "?"}` : <NotAvailable />}</td>
              <td className={cell(breathingFlag(v))}>{v.respiratoryRate ?? <NotAvailable />}</td>
              <td className={cell(oxygenFlag(v))}>{v.oxygenSaturation ? `${v.oxygenSaturation}%` : <NotAvailable />}</td>
              <td className="px-4 py-3 text-slate-700">{v.weight ?? <NotAvailable />}</td>
              <td className="px-4 py-3 text-slate-700">{v.height ?? <NotAvailable />}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{v.recordedBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-slate-500">
        <span className="rounded bg-red-50 px-1.5 font-bold text-red-800">Red</span> = critical,{" "}
        <span className="rounded bg-amber-50 px-1.5 font-medium text-amber-800">amber</span> = abnormal
      </p>
    </div>
  );
}
