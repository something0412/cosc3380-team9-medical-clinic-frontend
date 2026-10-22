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
    specialties: { name: string; isPrimary: boolean }[];
  } | null;
  nurse: {
    licenseNumber: string;
    licenseState: string;
    licenseExpiration: string;
    nursingLevel: string;
  } | null;
}

export async function getEmployees() {
  const res = await api.get<AdminEmployee[]>("/api/admin/employees");
  return res.data;
}

export async function getEmployee(employeeId: number) {
  const res = await api.get<AdminEmployeeDetails>(`/api/admin/employees/${employeeId}`);
  return res.data;
}
