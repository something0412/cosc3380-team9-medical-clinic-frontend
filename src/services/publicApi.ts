import { api } from "../api";

// public website data, matching what /api/public returns

export interface PublicDoctor {
  doctorId: number;
  firstName: string;
  lastName: string;
  specialties: { specialtyId: number; name: string; isPrimary: boolean }[];
  offices: { officeId: number; name: string }[];
}

export interface PublicOffice {
  officeId: number;
  name: string;
  street: string;
  apt: string | null;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

export interface PublicDoctorDetails extends Omit<PublicDoctor, "offices"> {
  offices: (PublicOffice & { days: string[] })[];
}

export interface PublicSpecialty {
  specialtyId: number;
  name: string;
  requiresReferral: boolean;
  doctorCount: number;
}

export async function getPublicDoctors() {
  const res = await api.get<PublicDoctor[]>("/api/public/doctors");
  return res.data;
}

export async function getPublicDoctor(doctorId: string) {
  const res = await api.get<PublicDoctorDetails>(`/api/public/doctors/${encodeURIComponent(doctorId)}`);
  return res.data;
}

export async function getPublicOffices() {
  const res = await api.get<PublicOffice[]>("/api/public/offices");
  return res.data;
}

export async function getPublicSpecialties() {
  const res = await api.get<PublicSpecialty[]>("/api/public/specialties");
  return res.data;
}
