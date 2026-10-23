// shared types

// patient
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
  // Optional patient-portal login; needs an email (the username).
  portalPassword: string | null;
}

// The demographic fields a receptionist can edit (PUT /api/patients/:id).
export type PatientDetails = Pick<
  CreatePatientRequest,
  "firstName" | "lastName" | "dob" | "gender" | "phone" | "email" | "address"
>;

// template response
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

// Where a visit is in the waiting room, worked out by the backend from the
// check-in times and whether the nurse has written a note.
export type VisitState = "Expected" | "Waiting" | "With nurse" | "Done" | "No Show" | "Cancelled";

export interface Appointment {
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  officeId: number;
  scheduledAt: string; // "YYYY-MM-DDTHH:MM:SS", clinic-local time
  specialty: string;
  status: AppointmentStatus;
  checkedInAt: string | null; // set by the receptionist at check-in
  checkedOutAt: string | null;
  visitState: VisitState;
  // Readiness flags for the front desk and nurses.
  missingForms: number; // required forms not completed
  insuranceStatus: Insurance["status"] | null; // null = no insurance on file
  hasSevereAllergy: boolean;
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
  category: HomeMedCategory | null; // home meds only
  startDate: string;
}

// GET /api/allergy-types
export interface AllergyType {
  allergyTypeId: number;
  name: string;
  category: Allergy["category"];
}

// GET /api/medications — the list a home medication can be picked from.
export interface MedicationOption {
  medicationId: number;
  name: string;
}

export type HomeMedCategory = "Prescription" | "OTC" | "Supplement";

// GET /api/appointments/:appointmentId/summary (null until a note exists)
export interface VisitSummary {
  notes: string | null;
  diagnosis: string | null;
  recordedBy: string;
  recordedDate: string;
}

// GET /api/lab-test-types
export interface LabTestType {
  labTestTypeId: number;
  name: string;
  cost: string;
}

export type LabStatus = "Ordered" | "InProgress" | "Completed" | "Cancelled";

// GET /api/patients/:patientId/lab-orders
export interface LabOrder {
  labOrderId: number;
  appointmentId: number | null;
  testName: string;
  status: LabStatus;
  orderDate: string;
  resultNotes: string | null;
  orderedBy: string;
}

// GET /api/office-supplies?officeId=
export interface OfficeSupply {
  officeSupplyId: number;
  supplyId: number;
  name: string;
  type: string;
  quantityOnHand: number;
  reorderThreshold: number;
  expirationDate: string | null;
  lowStock: boolean; // at or below the reorder threshold
  expiringSoon: boolean; // expires within 30 days
}

// GET /api/supply-orders?officeId=
export interface SupplyOrder {
  supplyOrderId: number;
  supplyName: string;
  quantityOrdered: number;
  orderDate: string;
  status: "Pending" | "Ordered" | "Received" | "Cancelled";
  requestedBy: string;
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

// GET /api/specialties
export interface Specialty {
  specialtyId: number;
  name: string;
  requiresReferral: boolean;
}

// GET /api/availability?date=&officeId=&specialtyId=&doctorId=
// One open slot with one doctor.
export interface AvailableSlot {
  doctorId: number;
  doctorName: string;
  timeSlotId: number;
  startTime: string; // "09:00"
  endTime: string;
  specialty: string;
  requiresReferral: boolean;
}

// GET /api/patients/:patientId/referrals — referrals valid for a booking.
export interface Referral {
  referralId: number;
  referredBy: string;
  dateIssued: string;
  expirationDate: string;
}

// GET /api/patients/:patientId — the receptionist's patient profile.
export interface PatientProfile extends Patient {
  gender: string | null;
  address: string | null;
  hasPortalAccount: boolean;
  emergencyContacts: EmergencyContact[];
  insurance: Insurance | null;
}

// GET /api/patients/:patientId/forms — every form type with this
// patient's status for it.
export interface FormStatus {
  formTypeId: number;
  name: string;
  isRequired: boolean;
  status: "Not started" | "Pending" | "Completed";
  submittedDate: string | null;
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

// GET /api/appointments/:appointmentId/invoice-estimate — the least a
// visit can be billed: the check-in fee plus its (non-cancelled) labs.
export interface InvoiceEstimate {
  appointmentId: number;
  checkInFee: string;
  labs: { labOrderId: number; name: string; cost: string }[];
  minimumAmount: string;
}

// GET /api/invoices?officeId=&status= — one row of the billing worklist.
export interface WorklistInvoice {
  invoiceId: number;
  patientId: number;
  patientName: string;
  appointmentDate: string;
  issueDate: string;
  amount: string;
  balance: string;
  status: Invoice["status"];
}

// GET /api/payments/:paymentId/receipt
export interface Receipt {
  paymentId: number;
  paymentDate: string;
  amountPaid: string;
  paymentType: string;
  handledBy: string | null;
  invoiceId: number;
  invoiceAmount: string;
  paidToDate: string;
  balanceAfter: string;
  patientId: number;
  patientName: string;
  visitDate: string;
  officeName: string;
  officeAddress: string;
  officePhone: string;
}

// auth
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
  officeId: number;
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

// profiles
export interface EmergencyContact {
  emergencyContactId: number;
  firstName: string;
  lastName: string;
  relationship: string;
  phoneNumber: string;
  isPrimary: boolean;
}

export type EmergencyContactInput = Omit<EmergencyContact, "emergencyContactId">;

export interface Insurance {
  provider: string;
  policyNumber: string;
  status: "Pending" | "Verified" | "Denied";
}

export interface PatientProfile {
  patientId: number;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  isActive: boolean;
  emergencyContacts: EmergencyContact[];
  insurance: Insurance | null;
}

export interface PatientContactInfo {
  phone: string;
  email: string;
  address: string | null;
  gender: string | null;
}

export interface Certificate {
  certificateId: number;
  name: string;
  status: "Active" | "Expired" | "Revoked";
  issueDate: string;
  expirationDate: string;
}

export type CertificateInput = Pick<Certificate, "name" | "issueDate" | "expirationDate">;

export interface DoctorScheduleEntry {
  dayOfWeek: string;
  officeName: string;
  specialty: string;
  shift: string;
  startTime: string;
  endTime: string;
}

export interface StaffProfile {
  employeeId: number;
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;
  email: string;
  isActive: boolean;
  employeeType: string;
  officeName: string;
  doctor: {
    licenseNumber: string;
    licenseState: string;
    licenseExpiration: string;
    npiNumber: string;
    deaNumber: string | null;
    specialties: { name: string; isPrimary: boolean }[];
    schedule: DoctorScheduleEntry[];
  } | null;
  nurse: {
    licenseNumber: string;
    licenseState: string;
    licenseExpiration: string;
    nursingLevel: string;
  } | null;
  certificates: Certificate[];
}
