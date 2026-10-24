import { isAxiosError } from "axios";
import { api } from "../api";

// one open appointment time from the shared booking service
export interface AvailableSlot {
  date: string;
  doctorId: number;
  doctorName: string;
  officeId: number;
  officeName: string;
  specialtyId: number;
  specialty: string;
  requiresReferral: boolean;
  timeSlotId: number;
  startTime: string;
  endTime: string;
  // only the signed in search includes the referral that would be used
  referralId?: number | null;
}

// what identifies a chosen time, since the office follows from the doctor's schedule that day
export interface SlotChoice {
  date: string;
  doctorId: number;
  timeSlotId: number;
}

export interface AvailabilitySearch {
  specialtyId: number;
  date: string;
  days: number;
  doctorId?: number;
  officeId?: number;
}

// what POST /api/appointments takes from a patient, since the session says who the patient is
export interface BookingRequest {
  doctorId: number;
  specialtyId: number;
  date: string;
  timeSlotId: number;
  referralId?: number;
}

// a saved appointment, as POST /api/appointments and GET /api/appointments/:id return it
export interface BookedAppointment {
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  officeId: number;
  officeName: string;
  specialtyId: number;
  specialty: string;
  date: string;
  timeSlotId: number;
  startTime: string;
  endTime: string;
  status: string;
  bookingChannel: string;
  referralId: number | null;
  checkedIn: boolean;
}

export function isSameSlot(a: SlotChoice, b: SlotChoice) {
  return a.date === b.date && a.doctorId === b.doctorId && a.timeSlotId === b.timeSlotId;
}

// open times for visitors who haven't signed in
export async function getPublicAvailability(search: AvailabilitySearch) {
  const res = await api.get<AvailableSlot[]>("/api/public/availability", { params: search });
  return res.data;
}

// open times for the signed in patient, without their own conflicts and with referrals filled in
export async function getPatientAvailability(search: AvailabilitySearch) {
  const res = await api.get<AvailableSlot[]>("/api/availability", { params: search });
  return res.data;
}

// books the time for the signed in patient
export async function bookAppointment(request: BookingRequest) {
  const res = await api.post<BookedAppointment>("/api/appointments", request);
  return res.data;
}

// one of the signed in patient's appointments
export async function getAppointment(appointmentId: string) {
  const res = await api.get<BookedAppointment>(`/api/appointments/${encodeURIComponent(appointmentId)}`);
  return res.data;
}

// the HTTP status of a failed request, or null when the server never answered
export function errorStatus(err: unknown) {
  return isAxiosError(err) ? (err.response?.status ?? null) : null;
}
