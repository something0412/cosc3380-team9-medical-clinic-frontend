// Fake sample data for the nursing pages. Only used when
// VITE_USE_MOCK_DATA=true (see nursingApi.ts), so the pages can be demoed
// before the backend routes exist. Delete this file once they do.

import type { AnesthesiaRecord, Appointment, PatientChart } from "../types";

// Today at the given hour, so the sample appointments are always "today".
function todayAt(hour: number): string {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const mockAppointments: Appointment[] = [
  { appointmentId: 1, patientId: 1, patientName: "Maria Gonzalez", doctorName: "Dr. Smith", scheduledAt: todayAt(9), reason: "Annual physical", status: "Checked In", roomNumber: null, requiresAnesthesia: false },
  { appointmentId: 2, patientId: 2, patientName: "James Carter", doctorName: "Dr. Lee", scheduledAt: todayAt(10), reason: "Colonoscopy", status: "Checked In", roomNumber: "2", requiresAnesthesia: true },
  { appointmentId: 3, patientId: 3, patientName: "Aisha Patel", doctorName: "Dr. Smith", scheduledAt: todayAt(11), reason: "Asthma follow-up", status: "Scheduled", roomNumber: null, requiresAnesthesia: false },
  { appointmentId: 4, patientId: 4, patientName: "Robert Nguyen", doctorName: "Dr. Lee", scheduledAt: todayAt(13), reason: "Skin lesion removal", status: "Scheduled", roomNumber: null, requiresAnesthesia: true },
];

// Keyed by patientId.
export const mockCharts: Record<number, PatientChart> = {
  1: {
    patient: { patientId: 1, firstName: "Maria", lastName: "Gonzalez", dob: "1985-04-12", phone: "713-555-0101", email: null, isActive: true },
    bloodType: "O+",
    allergies: [{ allergyId: 1, allergen: "Penicillin", reaction: "Hives", severity: "Moderate" }],
    vitals: [],
    medications: [{ medicationId: 1, name: "Lisinopril", dosage: "10 mg", frequency: "Daily", lastGivenAt: null }],
    notes: [],
  },
  2: {
    patient: { patientId: 2, firstName: "James", lastName: "Carter", dob: "1972-11-03", phone: "713-555-0102", email: null, isActive: true },
    bloodType: "A-",
    allergies: [],
    vitals: [],
    medications: [],
    notes: [],
  },
  3: {
    patient: { patientId: 3, firstName: "Aisha", lastName: "Patel", dob: "1999-07-21", phone: "713-555-0103", email: null, isActive: true },
    bloodType: null,
    allergies: [{ allergyId: 2, allergen: "Peanuts", reaction: "Anaphylaxis", severity: "Severe" }],
    vitals: [],
    medications: [{ medicationId: 2, name: "Albuterol inhaler", dosage: "90 mcg", frequency: "As needed", lastGivenAt: null }],
    notes: [],
  },
  4: {
    patient: { patientId: 4, firstName: "Robert", lastName: "Nguyen", dob: "1958-01-30", phone: "713-555-0104", email: null, isActive: true },
    bloodType: "B+",
    allergies: [{ allergyId: 3, allergen: "Sulfa drugs", reaction: "Rash", severity: "Mild" }],
    vitals: [],
    medications: [],
    notes: [],
  },
};

// Keyed by appointmentId.
export const mockAnesthesia: Record<number, AnesthesiaRecord> = {};
