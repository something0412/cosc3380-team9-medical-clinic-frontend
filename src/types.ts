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

// Shape of the JSON returned by GET /api/template.
export interface TemplateResponse {
  message: string;
  timestamp: string;
}
