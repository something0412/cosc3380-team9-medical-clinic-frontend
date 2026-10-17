import { isAxiosError } from "axios";
import { api } from "../api";
import type { PatientAuthResponse, PatientSignupRequest, StaffAuthResponse } from "../types";

export async function patientSignup(body: PatientSignupRequest) {
  const res = await api.post<PatientAuthResponse>("/api/auth/patient/signup", body);
  return res.data;
}

export async function patientLogin(patientId: number, email: string, password: string) {
  const res = await api.post<PatientAuthResponse>("/api/auth/patient/login", { patientId, email, password });
  return res.data;
}

export async function staffLogin(employeeId: number, password: string) {
  const res = await api.post<StaffAuthResponse>("/api/auth/staff/login", { employeeId, password });
  return res.data;
}

export function authErrorMessage(err: unknown) {
  if (isAxiosError(err)) {
    if (!err.response) return "Can't reach the server. Is the backend running?";
    return err.response.data?.error ?? "Something went wrong";
  }
  return "Something went wrong";
}
