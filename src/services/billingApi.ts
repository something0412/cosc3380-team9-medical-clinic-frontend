// Backend calls for billing: the patient's own Billing page reads; the
// receptionist's Billing page reads and writes. Each function lists the
// route it calls; the data shapes are in types.ts.

import { api } from "../api";
import type {
  BillingData,
  Invoice,
  InvoiceEstimate,
  Payment,
  PaymentType,
  Receipt,
  UninvoicedAppointment,
  WorklistInvoice,
} from "../types";

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

// GET /api/appointments/:appointmentId/invoice-estimate
export async function getInvoiceEstimate(appointmentId: number): Promise<InvoiceEstimate> {
  const res = await api.get<InvoiceEstimate>(`/api/appointments/${appointmentId}/invoice-estimate`);
  return res.data;
}

// POST /api/invoices  (receptionists only). Leave `amount` out to bill
// exactly the minimum; the backend rejects anything below it.
export async function createInvoice(employeeId: number, appointmentId: number, amount?: number): Promise<Invoice> {
  const res = await api.post<Invoice>("/api/invoices", { employeeId, appointmentId, amount });
  return res.data;
}

// GET /api/invoices?officeId=&status=  — the office's billing worklist
export async function getWorklist(officeId: number, status: Invoice["status"] = "Pending"): Promise<WorklistInvoice[]> {
  const res = await api.get<WorklistInvoice[]>("/api/invoices", { params: { officeId, status } });
  return res.data;
}

// POST /api/invoices/:invoiceId/payments  (receptionists only)
export async function recordPayment(
  employeeId: number,
  invoiceId: number,
  paymentTypeId: number,
  amount: number,
): Promise<Omit<Payment, "paymentType">> {
  const res = await api.post(`/api/invoices/${invoiceId}/payments`, { employeeId, paymentTypeId, amount });
  return res.data;
}

// GET /api/payments/:paymentId/receipt
export async function getReceipt(paymentId: number): Promise<Receipt> {
  const res = await api.get<Receipt>(`/api/payments/${paymentId}/receipt`);
  return res.data;
}

export function money(amount: number | string) {
  return `$${Number(amount).toFixed(2)}`;
}
