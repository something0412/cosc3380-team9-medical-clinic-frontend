// Backend calls for the receptionist's Patient Appointments page. Each
// function lists the route it calls; the data shapes are in types.ts.
//
// `employeeId` is always the logged-in receptionist; the backend rejects
// anyone else.

import { api } from "../api";
import type { Appointment, AvailableSlot, CreatePatientRequest, Doctor, Patient } from "../types";

// POST /api/patients
export async function registerPatient(employeeId: number, patient: CreatePatientRequest): Promise<Patient> {
  const res = await api.post<Patient>("/api/patients", { ...patient, employeeId });
  return res.data;
}

// GET /api/doctors
export async function getDoctors(): Promise<Doctor[]> {
  const res = await api.get<Doctor[]>("/api/doctors");
  return res.data;
}

// GET /api/doctors/:doctorId/availability?date=YYYY-MM-DD
export async function getAvailability(doctorId: number, date: string): Promise<AvailableSlot[]> {
  const res = await api.get<AvailableSlot[]>(`/api/doctors/${doctorId}/availability`, { params: { date } });
  return res.data;
}

// GET /api/appointments?date=YYYY-MM-DD
export async function getAppointments(date: string): Promise<Appointment[]> {
  const res = await api.get<Appointment[]>("/api/appointments", { params: { date } });
  return res.data;
}

// POST /api/appointments
export async function bookAppointment(
  employeeId: number,
  booking: { patientId: number; doctorId: number; date: string; timeSlotId: number; referralId: number | null },
): Promise<Appointment> {
  const res = await api.post<Appointment>("/api/appointments", { ...booking, employeeId });
  return res.data;
}

// PATCH /api/appointments/:appointmentId/check-in  (or /check-out)
export async function updateVisit(
  employeeId: number,
  appointmentId: number,
  action: "check-in" | "check-out",
): Promise<Appointment> {
  const res = await api.patch<Appointment>(`/api/appointments/${appointmentId}/${action}`, { employeeId });
  return res.data;
}
