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
export interface CreatePatientRequest {
    firstName: string;
    lastName: string;
    dob: string;
    gender: string;
    phone: string;
    email: string;
    address: string;
    // Collected by the receptionist when registering a new patient.
    emergencyContactName: string;
    emergencyContactPhone: string;
    insuranceProvider: string;
    insurancePolicyNumber: string;
}

// Shape of the JSON returned by GET /api/template.
export interface TemplateResponse {
  message: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Nursing pages (RN / CRNA / NA)
//
// The backend routes for these don't exist yet — see services/nursingApi.ts.
// When they're written, alias the SQL columns to these camelCase names
// (same as GET /api/patients) and the pages will work as-is.
// ---------------------------------------------------------------------------

export type NurseType = "RN" | "CRNA" | "NA";

export interface Allergy {
  allergyId: number;
  allergen: string; // e.g. "Penicillin"
  reaction: string | null; // e.g. "Hives"
  severity: "Mild" | "Moderate" | "Severe";
}

// Set by the receptionist. Nurses only read it.
export type AppointmentStatus = "Scheduled" | "Checked In" | "Checked Out";

export interface Appointment {
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorName: string;
  scheduledAt: string; // ISO date-time
  reason: string | null;
  status: AppointmentStatus;
  roomNumber: string | null; // set by an NA when rooming the patient
  requiresAnesthesia: boolean; // true → shows up for CRNAs
}

export interface Vitals {
  vitalsId: number;
  patientId: number;
  recordedAt: string;
  recordedBy: NurseType;
  systolic: number | null;
  diastolic: number | null;
  heartRate: number | null;
  respiratoryRate: number | null;
  temperatureF: number | null;
  oxygenSaturation: number | null;
}

export interface Medication {
  medicationId: number;
  name: string;
  dosage: string; // e.g. "10 mg"
  frequency: string; // e.g. "Daily"
  lastGivenAt: string | null; // last time an RN recorded a dose
}

export interface ChartNote {
  noteId: number;
  patientId: number;
  createdAt: string;
  authorRole: NurseType;
  body: string;
}

// Everything on one patient's chart, returned by
// GET /api/patients/:patientId/chart in a single request.
export interface PatientChart {
  patient: Patient;
  bloodType: string | null; // e.g. "O+", null if never recorded
  allergies: Allergy[];
  vitals: Vitals[]; // newest first
  medications: Medication[];
  notes: ChartNote[]; // newest first
}

// One per appointment that needs anesthesia. Filled in by a CRNA.
export interface AnesthesiaRecord {
  appointmentId: number;
  consentSigned: boolean;
  asaClass: string; // patient risk class, "I" (healthy) to "V"
  anesthesiaType: string; // "General", "Regional", "Local", ...
  medicationsGiven: string;
  notes: string;
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
}

export interface PatientSignupRequest {
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;
  email: string;
  password: string;
}
