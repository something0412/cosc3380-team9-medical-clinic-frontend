// All backend calls for the nursing pages live in this one file. Each
// function lists the route it calls; the data shapes are in types.ts.

import { api } from "../api";
import type { Appointment, Patient, PatientChart, Vitals } from "../types";

// The vitals a nurse types in (the backend adds the rest).
export type NewVitals = Pick<
  Vitals,
  "temperatureF" | "heartRateBpm" | "systolic" | "diastolic" | "weightLbs" | "heightInches"
>;

// GET /api/patients
export async function getPatients(): Promise<Patient[]> {
  const res = await api.get<Patient[]>("/api/patients");
  return res.data;
}

// GET /api/appointments?date=YYYY-MM-DD
export async function getTodaysAppointments(): Promise<Appointment[]> {
  // "en-CA" formats the date as YYYY-MM-DD in local time.
  const today = new Date().toLocaleDateString("en-CA");
  const res = await api.get<Appointment[]>("/api/appointments", { params: { date: today } });
  return res.data;
}

// GET /api/patients/:patientId/chart
export async function getPatientChart(patientId: number): Promise<PatientChart> {
  const res = await api.get<PatientChart>(`/api/patients/${patientId}/chart`);
  return res.data;
}

// POST /api/patients/:patientId/vitals
// `employeeId` is the logged-in nurse; the backend rejects non-nurses.
export async function addVitals(
  patientId: number,
  employeeId: number,
  appointmentId: number | null,
  vitals: NewVitals,
): Promise<Vitals> {
  const res = await api.post<Vitals>(`/api/patients/${patientId}/vitals`, {
    ...vitals,
    recordedByEmployeeId: employeeId,
    appointmentId,
  });
  return res.data;
}
