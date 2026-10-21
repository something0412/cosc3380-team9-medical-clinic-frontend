// Backend calls for billing: the patient's own Billing page reads; the
// receptionist's Billing page reads and writes. Each function lists the
// route it calls; the data shapes are in types.ts.

import { api } from "../api";
import type { BillingData, Invoice, PaymentType, UninvoicedAppointment } from "../types";

// GET /api/patients/:patientId/billing
export async function getBilling(patientId: number): Promise<BillingData> {
  const res = await api.get<BillingData>(`/api/patients/${patientId}/billing`);
  return res.data;
}

// GET /api/patients/:patientId/uninvoiced-appointments
export async function getUninvoicedAppointments(patientId: number): Promise<UninvoicedAppointment[]> {
  const res = await api.get<UninvoicedAppointment[]>(`/api/patients/${patientId}/uninvoiced-appointments`);
  return res.data;
}

// GET /api/payment-types
export async function getPaymentTypes(): Promise<PaymentType[]> {
  const res = await api.get<PaymentType[]>("/api/payment-types");
  return res.data;
}

// POST /api/invoices  (receptionists only)
export async function createInvoice(employeeId: number, appointmentId: number, amount: number): Promise<Invoice> {
  const res = await api.post<Invoice>("/api/invoices", { employeeId, appointmentId, amount });
  return res.data;
}

// POST /api/invoices/:invoiceId/payments  (receptionists only)
export async function recordPayment(employeeId: number, invoiceId: number, paymentTypeId: number, amount: number) {
  await api.post(`/api/invoices/${invoiceId}/payments`, { employeeId, paymentTypeId, amount });
}

export function money(amount: number | string) {
  return `$${Number(amount).toFixed(2)}`;
}
