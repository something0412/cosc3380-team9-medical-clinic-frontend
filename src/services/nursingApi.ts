// All backend calls for the nursing pages live in this one file. Each
// function lists the route it calls; the data shapes are in types.ts.
//
// `employeeId` is always the logged-in nurse; the backend rejects anyone
// else and limits nurses to their own office.

import { api } from "../api";
import type {
  Allergy,
  AllergyType,
  Appointment,
  HomeMedCategory,
  LabOrder,
  LabStatus,
  LabTestType,
  MedicationOption,
  OfficeSupply,
  Patient,
  PatientChart,
  SupplyOrder,
  VisitSummary,
  Vitals,
} from "../types";
import { today } from "../utils/dates";

// --- Patients and the day's visits -------------------------------------------

// GET /api/patients
export async function getPatients(): Promise<Patient[]> {
  const res = await api.get<Patient[]>("/api/patients");
  return res.data;
}

// GET /api/appointments?date=today&officeId=
export async function getTodaysAppointments(officeId?: number): Promise<Appointment[]> {
  const res = await api.get<Appointment[]>("/api/appointments", {
    params: officeId ? { date: today(), officeId } : { date: today() },
  });
  return res.data;
}

// GET /api/patients/:patientId/chart
export async function getPatientChart(patientId: number): Promise<PatientChart> {
  const res = await api.get<PatientChart>(`/api/patients/${patientId}/chart`);
  return res.data;
}

// --- Vitals ---------------------------------------------------------------------

// The vitals a nurse types in (the backend adds the rest).
export type NewVitals = Pick<
  Vitals,
  "temperatureF" | "heartRateBpm" | "systolic" | "diastolic" | "weightLbs" | "heightInches"
>;

// POST /api/patients/:patientId/vitals
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

// --- Allergies --------------------------------------------------------------------

// GET /api/allergy-types
export async function getAllergyTypes(): Promise<AllergyType[]> {
  const res = await api.get<AllergyType[]>("/api/allergy-types");
  return res.data;
}

type AllergyInput = { reaction: string; severity: Allergy["severity"] };

// POST /api/patients/:patientId/allergies
export async function addAllergy(
  employeeId: number,
  patientId: number,
  allergy: AllergyInput & { allergyTypeId: number },
) {
  await api.post(`/api/patients/${patientId}/allergies`, { ...allergy, employeeId });
}

// PATCH /api/allergies/:allergyId
export async function updateAllergy(employeeId: number, allergyId: number, allergy: AllergyInput) {
  await api.patch(`/api/allergies/${allergyId}`, { ...allergy, employeeId });
}

// PATCH /api/allergies/:allergyId/deactivate
export async function removeAllergy(employeeId: number, allergyId: number) {
  await api.patch(`/api/allergies/${allergyId}/deactivate`, { employeeId });
}

// --- Home medications (what the patient already takes; not prescriptions) -------

// GET /api/medications
export async function getMedications(): Promise<MedicationOption[]> {
  const res = await api.get<MedicationOption[]>("/api/medications");
  return res.data;
}

export type HomeMedDetails = { category: HomeMedCategory | null; dosage: string; frequency: string };

// POST /api/patients/:patientId/home-medications — either a medicationId
// from the list or a typed medicationName.
export async function addHomeMedication(
  employeeId: number,
  patientId: number,
  med: HomeMedDetails & { medicationId: number | null; medicationName: string },
) {
  await api.post(`/api/patients/${patientId}/home-medications`, { ...med, employeeId });
}

// PATCH /api/home-medications/:homeMedicationId
export async function updateHomeMedication(employeeId: number, homeMedicationId: number, med: HomeMedDetails) {
  await api.patch(`/api/home-medications/${homeMedicationId}`, { ...med, employeeId });
}

// PATCH /api/home-medications/:homeMedicationId/deactivate
export async function stopHomeMedication(employeeId: number, homeMedicationId: number) {
  await api.patch(`/api/home-medications/${homeMedicationId}/deactivate`, { employeeId });
}

// --- Visit notes -------------------------------------------------------------------

// GET /api/appointments/:appointmentId/summary
export async function getVisitSummary(appointmentId: number): Promise<VisitSummary | null> {
  const res = await api.get<VisitSummary | null>(`/api/appointments/${appointmentId}/summary`);
  return res.data;
}

// POST /api/appointments/:appointmentId/notes
export async function addVisitNote(employeeId: number, appointmentId: number, text: string) {
  await api.post(`/api/appointments/${appointmentId}/notes`, { employeeId, text });
}

// --- Lab orders --------------------------------------------------------------------

// GET /api/lab-test-types
export async function getLabTestTypes(): Promise<LabTestType[]> {
  const res = await api.get<LabTestType[]>("/api/lab-test-types");
  return res.data;
}

// GET /api/patients/:patientId/lab-orders
export async function getLabOrders(patientId: number): Promise<LabOrder[]> {
  const res = await api.get<LabOrder[]>(`/api/patients/${patientId}/lab-orders`);
  return res.data;
}

// POST /api/lab-orders
export async function orderLab(
  employeeId: number,
  order: { patientId: number; labTestTypeId: number; appointmentId: number | null },
) {
  await api.post("/api/lab-orders", { ...order, employeeId });
}

// PATCH /api/lab-orders/:labOrderId — move the status on and/or save results.
export async function updateLabOrder(
  employeeId: number,
  labOrderId: number,
  update: { status: Exclude<LabStatus, "Ordered"> | null; resultNotes: string },
) {
  await api.patch(`/api/lab-orders/${labOrderId}`, { ...update, employeeId });
}

// --- Supplies ------------------------------------------------------------------------

// GET /api/office-supplies?officeId=
export async function getOfficeSupplies(officeId: number): Promise<OfficeSupply[]> {
  const res = await api.get<OfficeSupply[]>("/api/office-supplies", { params: { officeId } });
  return res.data;
}

// POST /api/office-supplies/:officeSupplyId/use
export async function recordSupplyUse(employeeId: number, officeSupplyId: number, quantity: number) {
  await api.post(`/api/office-supplies/${officeSupplyId}/use`, { employeeId, quantity });
}

// GET /api/supply-orders?officeId=
export async function getSupplyOrders(officeId: number): Promise<SupplyOrder[]> {
  const res = await api.get<SupplyOrder[]>("/api/supply-orders", { params: { officeId } });
  return res.data;
}

// POST /api/supply-orders
export async function requestRestock(employeeId: number, supplyId: number, quantity: number) {
  await api.post("/api/supply-orders", { employeeId, supplyId, quantity });
}
