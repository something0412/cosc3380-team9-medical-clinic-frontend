// Shared data shapes for the frontend, kept in one file instead of being
// redefined inside every component that needs them. If the backend model
// changes, there's exactly one place to update on this side.

// Matches the columns the backend's GET /api/patients query selects from
// the real `patient` table (see clinic_database_dump.sql and
// routes/patients.ts) — not every column on that table, just the ones
// the query aliases to camelCase and returns. Add fields here (and to
// that SELECT) together as the UI needs more of them.
export interface Patient {
  patientId: number;
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;
  email: string | null;
  isActive: boolean;
}
// Body of POST /api/patients (receptionist registration). Emergency
// contact and insurance are optional, but all-or-nothing.
export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: {
    firstName: string;
    lastName: string;
    relationship: string;
    phone: string;
  } | null;
  insurance: {
    provider: string;
    policyNumber: string;
  } | null;
}

// Shape of the JSON returned by GET /api/template.
export interface TemplateResponse {
  message: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Nursing pages
//
// Shapes returned by GET /api/appointments, GET /api/patients/:id/chart
// and POST /api/patients/:id/vitals (see backend routes/appointments.ts
// and routes/patients.ts).
// ---------------------------------------------------------------------------

export interface Allergy {
  allergyId: number;
  allergen: string; // e.g. "Penicillin"
  category: "Medication" | "Food" | "Environmental" | "Other" | null;
  reaction: string | null; // e.g. "Hives"
  severity: "Mild" | "Moderate" | "Severe";
}

// Set by the receptionist. Nurses only read it.
export type AppointmentStatus = "Scheduled" | "Cancelled" | "Completed" | "No Show";

export interface Appointment {
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorName: string;
  scheduledAt: string; // "YYYY-MM-DDTHH:MM:SS", clinic-local time
  specialty: string;
  status: AppointmentStatus;
  checkedInAt: string | null; // set by the receptionist at check-in
  checkedOutAt: string | null;
}

// One row of patient_vitals (see backend migrations/002_patient_vitals.sql).
// Every measurement is optional; null means "not taken".
export interface Vitals {
  vitalsId: number;
  patientId: number;
  appointmentId: number | null;
  recordedBy: string; // nurse's name
  temperatureF: number | null;
  heartRateBpm: number | null;
  systolic: number | null; // blood pressure, shown as "systolic-diastolic"
  diastolic: number | null;
  weightLbs: number | null;
  heightInches: number | null;
}

// A medication the patient is currently on: either one they take at home
// (home_medication) or one prescribed here (prescription_item).
export interface PatientMedication {
  source: "Home" | "Prescription";
  id: number; // only unique together with `source`
  name: string;
  dosage: string | null; // e.g. "10 mg"
  directions: string | null; // frequency or instructions, e.g. "Daily"
  startDate: string;
}

// Everything on one patient's chart, returned by
// GET /api/patients/:patientId/chart in a single request.
export interface PatientChart {
  patient: Patient & { gender: string | null };
  allergies: Allergy[];
  vitals: Vitals[]; // newest first
  medications: PatientMedication[];
}

// ---------------------------------------------------------------------------
// Front desk (receptionist): booking and billing
// ---------------------------------------------------------------------------

// GET /api/doctors
export interface Doctor {
  doctorId: number;
  name: string; // "Dr. Greg House"
  specialties: string | null; // "Family Medicine, Cardiology"
}

// GET /api/doctors/:doctorId/availability?date=
export interface AvailableSlot {
  timeSlotId: number;
  startTime: string; // "09:00"
  endTime: string;
  office: string;
  specialty: string;
  requiresReferral: boolean;
}

// Money comes back as strings ("150.00") so no cents are lost; convert
// with Number(...) only for display.
export interface Invoice {
  invoiceId: number;
  appointmentId: number;
  appointmentDate: string;
  issueDate: string;
  amount: string;
  amountPaid: string;
  balance: string;
  status: "Pending" | "Paid" | "Overdue";
}

export interface Payment {
  paymentId: number;
  invoiceId: number;
  paymentDate: string;
  amountPaid: string;
  paymentType: string;
}

export interface Insurance {
  provider: string;
  policyNumber: string;
  status: "Pending" | "Verified" | "Denied";
}

// GET /api/patients/:patientId/billing
export interface BillingData {
  insurance: Insurance | null;
  invoices: Invoice[];
  payments: Payment[];
}

// GET /api/patients/:patientId/uninvoiced-appointments
export interface UninvoicedAppointment {
  appointmentId: number;
  appointmentDate: string;
  specialty: string;
  doctorName: string;
}

// GET /api/payment-types
export interface PaymentType {
  paymentTypeId: number;
  name: string;
}

// Auth
export interface PatientAuthResponse {
  patientId: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface StaffAuthResponse {
  employeeId: number;
  firstName: string;
  lastName: string;
  employeeType: string;
  role: "doctor" | "admin" | "staff";
  // Which staff pages to show: nurses get charts, receptionists get the
  // front desk and billing.
  staffType: StaffType;
}

export type StaffType = "nurse" | "receptionist" | "other";

export interface PatientSignupRequest {
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;
  email: string;
  password: string;
}
