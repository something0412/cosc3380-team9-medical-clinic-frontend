import { api } from "../api";

export interface AdminEmployee {
  employeeId: number;
  firstName: string;
  lastName: string;
  employeeTypeId: number;
  employeeType: string;
  email: string;
  phone: string;
  officeId: number;
  officeName: string;
  isActive: boolean;
  hasLogin: boolean;
  loginActive: boolean | null;
}

export interface AdminEmployeeDetails extends AdminEmployee {
  dob: string;
  loginCreatedDate: string | null;
  doctor: {
    licenseNumber: string;
    licenseState: string;
    licenseExpiration: string;
    npiNumber: string;
    deaNumber: string | null;
    specialties: { specialtyId: number; name: string; isPrimary: boolean }[];
  } | null;
  nurse: {
    licenseNumber: string;
    licenseState: string;
    licenseExpiration: string;
    nursingLevel: string;
  } | null;
}

export interface EmployeeType {
  employeeTypeId: number;
  typeName: string;
}

export interface Office {
  officeId: number;
  name: string;
  apt: string | null;
  street: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  isActive: boolean;
}

export interface OfficeDetails extends Office {
  employeeCount: number;
  activeEmployeeCount: number;
  activeScheduleCount: number;
}

export type OfficeInput = Omit<Office, "officeId" | "isActive">;

// 50 states plus DC, matching the backend check
export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS",
  "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC",
  "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

export interface Specialty {
  specialtyId: number;
  name: string;
  requiresReferral: boolean;
  isActive: boolean;
}

export interface SpecialtyDetails extends Specialty {
  doctorCount: number;
  activeDoctorCount: number;
  activeScheduleCount: number;
}

export type SpecialtyInput = Pick<Specialty, "name" | "requiresReferral">;

// matches chk_nurse_level in the database
export const NURSING_LEVELS = ["RN", "LPN", "NP", "CNA"];

export interface EmployeeInput {
  firstName: string;
  lastName: string;
  dob: string;
  email: string;
  phone: string;
  employeeTypeId: number;
  officeId: number;
  doctor: {
    licenseNumber: string;
    licenseState: string;
    licenseExpiration: string;
    npiNumber: string;
    deaNumber: string | null;
    specialtyIds: number[];
    primarySpecialtyId: number;
  } | null;
  nurse: {
    licenseNumber: string;
    licenseState: string;
    licenseExpiration: string;
    nursingLevel: string;
  } | null;
}

export interface NewEmployeeInput extends EmployeeInput {
  login: { username: string; password: string } | null;
}

// positive whole number from the URL, or null
export function parseRouteId(value: string | undefined) {
  const id = Number(value);
  return value && /^\d+$/.test(value) && Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function getEmployees() {
  const res = await api.get<AdminEmployee[]>("/api/admin/employees");
  return res.data;
}

export async function getEmployee(employeeId: number) {
  const res = await api.get<AdminEmployeeDetails>(`/api/admin/employees/${employeeId}`);
  return res.data;
}

export async function createEmployee(input: NewEmployeeInput) {
  const res = await api.post<AdminEmployeeDetails>("/api/admin/employees", input);
  return res.data;
}

export async function updateEmployee(employeeId: number, input: EmployeeInput) {
  const res = await api.put<AdminEmployeeDetails>(`/api/admin/employees/${employeeId}`, input);
  return res.data;
}

export async function setEmployeeStatus(employeeId: number, isActive: boolean) {
  const res = await api.patch<AdminEmployeeDetails>(`/api/admin/employees/${employeeId}/status`, { isActive });
  return res.data;
}

export async function setLoginStatus(employeeId: number, loginActive: boolean) {
  const res = await api.patch<AdminEmployeeDetails>(`/api/admin/employees/${employeeId}/login-status`, { loginActive });
  return res.data;
}

export async function resetEmployeePassword(employeeId: number, password: string) {
  await api.put(`/api/admin/employees/${employeeId}/password`, { password });
}

export async function createEmployeeLogin(employeeId: number, login: { username: string; password: string }) {
  const res = await api.post<AdminEmployeeDetails>(`/api/admin/employees/${employeeId}/login`, login);
  return res.data;
}

export async function getEmployeeTypes() {
  const res = await api.get<EmployeeType[]>("/api/admin/employee-types");
  return res.data;
}

export async function getOffices() {
  const res = await api.get<Office[]>("/api/admin/offices");
  return res.data;
}

export async function getOffice(officeId: number) {
  const res = await api.get<OfficeDetails>(`/api/admin/offices/${officeId}`);
  return res.data;
}

export async function createOffice(input: OfficeInput) {
  const res = await api.post<OfficeDetails>("/api/admin/offices", input);
  return res.data;
}

export async function updateOffice(officeId: number, input: OfficeInput) {
  const res = await api.put<OfficeDetails>(`/api/admin/offices/${officeId}`, input);
  return res.data;
}

export async function setOfficeStatus(officeId: number, isActive: boolean) {
  const res = await api.patch<OfficeDetails>(`/api/admin/offices/${officeId}/status`, { isActive });
  return res.data;
}

export async function getSpecialties() {
  const res = await api.get<Specialty[]>("/api/admin/specialties");
  return res.data;
}

export async function getSpecialty(specialtyId: number) {
  const res = await api.get<SpecialtyDetails>(`/api/admin/specialties/${specialtyId}`);
  return res.data;
}

export async function createSpecialty(input: SpecialtyInput) {
  const res = await api.post<SpecialtyDetails>("/api/admin/specialties", input);
  return res.data;
}

export async function updateSpecialty(specialtyId: number, input: SpecialtyInput) {
  const res = await api.put<SpecialtyDetails>(`/api/admin/specialties/${specialtyId}`, input);
  return res.data;
}

export async function setSpecialtyStatus(specialtyId: number, isActive: boolean) {
  const res = await api.patch<SpecialtyDetails>(`/api/admin/specialties/${specialtyId}/status`, { isActive });
  return res.data;
}
