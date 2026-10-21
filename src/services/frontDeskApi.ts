// Backend calls for the receptionist's pages (Front Desk, Patients,
// Schedule). Each function lists the route it calls; the data shapes are
// in types.ts.
//
// `employeeId` is always the logged-in receptionist; the backend rejects
// anyone else and limits them to their own office.

import { api } from "../api";
import type {
  Appointment,
  AvailableSlot,
  CreatePatientRequest,
  Doctor,
  EmergencyContact,
  FormStatus,
  Insurance,
  Patient,
  PatientDetails,
  PatientProfile,
  Referral,
  Specialty,
} from "../types";

// --- Patients ---------------------------------------------------------------

// POST /api/patients
export async function registerPatient(employeeId: number, patient: CreatePatientRequest): Promise<Patient> {
  const res = await api.post<Patient>("/api/patients", { ...patient, employeeId });
  return res.data;
}

// GET /api/patients/:patientId
export async function getPatientProfile(patientId: number): Promise<PatientProfile> {
  const res = await api.get<PatientProfile>(`/api/patients/${patientId}`);
  return res.data;
}

// PUT /api/patients/:patientId
export async function updatePatient(employeeId: number, patientId: number, details: PatientDetails) {
  await api.put(`/api/patients/${patientId}`, { ...details, employeeId });
}

// POST /api/patients/:patientId/credentials
export async function createPortalAccount(employeeId: number, patientId: number, password: string) {
  await api.post(`/api/patients/${patientId}/credentials`, { employeeId, password });
}

// --- Intake -------------------------------------------------------------------

export type ContactInput = Omit<EmergencyContact, "emergencyContactId">;

// POST /api/patients/:patientId/emergency-contacts
export async function addEmergencyContact(employeeId: number, patientId: number, contact: ContactInput) {
  await api.post(`/api/patients/${patientId}/emergency-contacts`, { ...contact, employeeId });
}

// PUT /api/emergency-contacts/:contactId
export async function updateEmergencyContact(employeeId: number, contactId: number, contact: ContactInput) {
  await api.put(`/api/emergency-contacts/${contactId}`, { ...contact, employeeId });
}

// PATCH /api/emergency-contacts/:contactId/deactivate
export async function removeEmergencyContact(employeeId: number, contactId: number) {
  await api.patch(`/api/emergency-contacts/${contactId}/deactivate`, { employeeId });
}

// PUT /api/patients/:patientId/insurance
export async function saveInsurance(
  employeeId: number,
  patientId: number,
  insurance: { provider: string; policyNumber: string },
): Promise<Insurance> {
  const res = await api.put<Insurance>(`/api/patients/${patientId}/insurance`, { ...insurance, employeeId });
  return res.data;
}

// PATCH /api/patients/:patientId/insurance/status
export async function setInsuranceStatus(employeeId: number, patientId: number, status: Insurance["status"]) {
  await api.patch(`/api/patients/${patientId}/insurance/status`, { employeeId, status });
}

// GET /api/patients/:patientId/forms
export async function getPatientForms(patientId: number): Promise<FormStatus[]> {
  const res = await api.get<FormStatus[]>(`/api/patients/${patientId}/forms`);
  return res.data;
}

// PATCH /api/patients/:patientId/forms/:formTypeId/complete
export async function completeForm(employeeId: number, patientId: number, formTypeId: number) {
  await api.patch(`/api/patients/${patientId}/forms/${formTypeId}/complete`, { employeeId });
}

// --- Scheduling ---------------------------------------------------------------

// GET /api/specialties
export async function getSpecialties(): Promise<Specialty[]> {
  const res = await api.get<Specialty[]>("/api/specialties");
  return res.data;
}

// GET /api/doctors?specialtyId=
export async function getDoctors(specialtyId?: number): Promise<Doctor[]> {
  const res = await api.get<Doctor[]>("/api/doctors", { params: specialtyId ? { specialtyId } : {} });
  return res.data;
}

// GET /api/availability?date=&officeId=&specialtyId=&doctorId=
export async function getAvailability(query: {
  date: string;
  officeId: number;
  specialtyId: number;
  doctorId?: number;
}): Promise<AvailableSlot[]> {
  const res = await api.get<AvailableSlot[]>("/api/availability", { params: query });
  return res.data;
}

// GET /api/patients/:patientId/referrals?doctorId=&specialtyId=&date=
export async function getReferrals(
  patientId: number,
  query: { doctorId: number; specialtyId: number; date: string },
): Promise<Referral[]> {
  const res = await api.get<Referral[]>(`/api/patients/${patientId}/referrals`, { params: query });
  return res.data;
}

// POST /api/appointments
export async function bookAppointment(
  employeeId: number,
  booking: {
    patientId: number;
    doctorId: number;
    specialtyId: number;
    date: string;
    timeSlotId: number;
    referralId: number | null;
  },
): Promise<Appointment> {
  const res = await api.post<Appointment>("/api/appointments", { ...booking, employeeId });
  return res.data;
}

// --- The day's visits -----------------------------------------------------------

// GET /api/appointments?date=&officeId=
export async function getAppointments(date: string, officeId?: number): Promise<Appointment[]> {
  const res = await api.get<Appointment[]>("/api/appointments", {
    params: officeId ? { date, officeId } : { date },
  });
  return res.data;
}

// PATCH /api/appointments/:appointmentId/check-in | check-out | no-show
export async function updateVisit(
  employeeId: number,
  appointmentId: number,
  action: "check-in" | "check-out" | "no-show",
): Promise<Appointment> {
  const res = await api.patch<Appointment>(`/api/appointments/${appointmentId}/${action}`, { employeeId });
  return res.data;
}
