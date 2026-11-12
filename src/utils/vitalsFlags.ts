import type { Vitals } from "../components/VitalsTable";

export type Flag = "critical" | "abnormal" | null;

// clinic limits: temp <95/>104 critical, <96/>100.4 abnormal; heart rate <40/>130 critical, <50/>110 abnormal;
// blood pressure sys >=180 or dia >=120 or sys <80 critical, sys >=140 or dia >=90 or sys <90 abnormal;
// breathing <8/>30 critical, <12/>20 abnormal; oxygen <90 critical, <95 abnormal
export function temperatureFlag(v: Vitals): Flag {
  if (v.temperature == null) return null;
  if (v.temperature < 95 || v.temperature > 104) return "critical";
  if (v.temperature < 96 || v.temperature > 100.4) return "abnormal";
  return null;
}

export function heartRateFlag(v: Vitals): Flag {
  if (v.heartRate == null) return null;
  if (v.heartRate < 40 || v.heartRate > 130) return "critical";
  if (v.heartRate < 50 || v.heartRate > 110) return "abnormal";
  return null;
}

export function bloodPressureFlag(v: Vitals): Flag {
  if (v.systolic == null && v.diastolic == null) return null;
  const sys = v.systolic ?? 120;
  const dia = v.diastolic ?? 80;
  if (sys >= 180 || dia >= 120 || sys < 80) return "critical";
  if (sys >= 140 || dia >= 90 || sys < 90) return "abnormal";
  return null;
}

export function breathingFlag(v: Vitals): Flag {
  if (v.respiratoryRate == null) return null;
  if (v.respiratoryRate < 8 || v.respiratoryRate > 30) return "critical";
  if (v.respiratoryRate < 12 || v.respiratoryRate > 20) return "abnormal";
  return null;
}

export function oxygenFlag(v: Vitals): Flag {
  if (v.oxygenSaturation == null) return null;
  if (v.oxygenSaturation < 90) return "critical";
  if (v.oxygenSaturation < 95) return "abnormal";
  return null;
}

// which readings are critical or abnormal
export function vitalsFlags(v: Vitals) {
  return {
    temperature: temperatureFlag(v),
    heartRate: heartRateFlag(v),
    bloodPressure: bloodPressureFlag(v),
    breathing: breathingFlag(v),
    oxygen: oxygenFlag(v),
  };
}

// colors for flagged readings
export const FLAG_STYLE = {
  critical: "bg-red-50 font-bold text-red-800",
  abnormal: "bg-amber-50 font-medium text-amber-800",
};
