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
// template response
export interface TemplateResponse {
  message: string;
  timestamp: string;
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
  role: "doctor" | "admin" | "staff" | "lab";
}

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
  primaryDoctor: { doctorId: number; name: string } | null;
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
