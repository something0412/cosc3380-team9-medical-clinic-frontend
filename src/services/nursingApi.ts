// All backend calls for the nursing pages live in this one file, so when
// the backend routes are built this is the only place to hook them up.
// Each function lists the route it needs; the data shapes are in types.ts.
//
// Until those routes exist, set VITE_USE_MOCK_DATA=true in .env.local to
// use the fake data in mockNursingData.ts instead.

import { api } from "../api";
import type {
  AnesthesiaRecord,
  Appointment,
  NurseType,
  Patient,
  PatientChart,
  Vitals,
} from "../types";
import { mockAnesthesia, mockAppointments, mockCharts } from "./mockNursingData";

const USE_MOCKS = import.meta.env.VITE_USE_MOCK_DATA === "true";

// The vitals a nurse types in (the backend adds the id and timestamp).
export type NewVitals = Omit<Vitals, "vitalsId" | "patientId" | "recordedAt" | "recordedBy">;

// GET /api/patients (already exists on the backend)
export async function getPatients(): Promise<Patient[]> {
  if (USE_MOCKS) return Object.values(mockCharts).map((c) => c.patient);
  const res = await api.get<Patient[]>("/api/patients");
  return res.data;
}

// GET /api/appointments?date=YYYY-MM-DD
export async function getTodaysAppointments(): Promise<Appointment[]> {
  if (USE_MOCKS) return [...mockAppointments];
  // "en-CA" formats the date as YYYY-MM-DD in local time.
  const today = new Date().toLocaleDateString("en-CA");
  const res = await api.get<Appointment[]>("/api/appointments", { params: { date: today } });
  return res.data;
}

// GET /api/patients/:patientId/chart
export async function getPatientChart(patientId: number): Promise<PatientChart> {
  if (USE_MOCKS) return { ...mockCharts[patientId] };
  const res = await api.get<PatientChart>(`/api/patients/${patientId}/chart`);
  return res.data;
}

// POST /api/patients/:patientId/vitals
export async function addVitals(patientId: number, role: NurseType, vitals: NewVitals) {
  if (USE_MOCKS) {
    const chart = mockCharts[patientId];
    chart.vitals = [
      { ...vitals, vitalsId: Date.now(), patientId, recordedAt: new Date().toISOString(), recordedBy: role },
      ...chart.vitals,
    ];
    return;
  }
  await api.post(`/api/patients/${patientId}/vitals`, { ...vitals, recordedBy: role });
}

// POST /api/patients/:patientId/notes
export async function addNote(patientId: number, role: NurseType, body: string) {
  if (USE_MOCKS) {
    const chart = mockCharts[patientId];
    chart.notes = [
      { noteId: Date.now(), patientId, createdAt: new Date().toISOString(), authorRole: role, body },
      ...chart.notes,
    ];
    return;
  }
  await api.post(`/api/patients/${patientId}/notes`, { authorRole: role, body });
}

// POST /api/patients/:patientId/medications/:medicationId/give  (RN only)
export async function giveMedication(patientId: number, medicationId: number) {
  if (USE_MOCKS) {
    const chart = mockCharts[patientId];
    chart.medications = chart.medications.map((m) =>
      m.medicationId === medicationId ? { ...m, lastGivenAt: new Date().toISOString() } : m,
    );
    return;
  }
  await api.post(`/api/patients/${patientId}/medications/${medicationId}/give`);
}

// PATCH /api/appointments/:appointmentId/room  (NA)
export async function roomPatient(appointmentId: number, roomNumber: string) {
  if (USE_MOCKS) {
    const appt = mockAppointments.find((a) => a.appointmentId === appointmentId);
    if (appt) appt.roomNumber = roomNumber;
    return;
  }
  await api.patch(`/api/appointments/${appointmentId}/room`, { roomNumber });
}

// GET /api/appointments/:appointmentId/anesthesia  (CRNA)
// Returns null if no record has been filled in yet.
export async function getAnesthesiaRecord(appointmentId: number): Promise<AnesthesiaRecord | null> {
  if (USE_MOCKS) return mockAnesthesia[appointmentId] ?? null;
  const res = await api.get<AnesthesiaRecord | null>(`/api/appointments/${appointmentId}/anesthesia`);
  return res.data;
}

// PUT /api/appointments/:appointmentId/anesthesia  (CRNA, creates or updates)
export async function saveAnesthesiaRecord(record: AnesthesiaRecord) {
  if (USE_MOCKS) {
    mockAnesthesia[record.appointmentId] = record;
    return;
  }
  await api.put(`/api/appointments/${record.appointmentId}/anesthesia`, record);
}
