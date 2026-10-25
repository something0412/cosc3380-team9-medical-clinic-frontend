import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, apiErrorMessage } from "../../api";
import { ADMIN_PRIMARY_BUTTON } from "../../components/admin/styles";
import { ErrorText, Field, SelectField } from "../../components/FormControls";
import { InvoiceLines } from "../../components/InvoiceLines";
import type { InvoiceItem } from "../../components/InvoiceLines";
import { Modal } from "../../components/Modal";
import { PageError, PortalPage } from "../../components/PortalPage";
import { FormActions, PrimaryButton, Section, StatusBadge, SuccessText, TextButton } from "../../components/ProfileUI";
import { formatId } from "../../utils/id";

interface Invoice {
  invoiceId: number;
  patientId: number;
  patientName: string;
  appointmentDate: string;
  doctorName: string;
  issueDate: string;
  amount: string;
  paid: string;
  balance: string;
  status: string;
}

interface Payment {
  paymentId: number;
  paymentDate: string;
  amountPaid: string;
  paymentType: string;
  status: string;
  handledBy: string | null;
}

interface InvoiceDetail extends Invoice {
  items: InvoiceItem[];
  payments: Payment[];
}

const money = (value: string | number) => `$${Number(value).toFixed(2)}`;

export function ReceptionistBilling() {
  const [status, setStatus] = useState("unpaid");
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openInvoiceId, setOpenInvoiceId] = useState<number | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  // load the invoices at my office
  useEffect(() => {
    async function loadInvoices() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get<Invoice[]>("/api/receptionist/invoices", { params: { status: status || undefined, search } });
        setInvoices(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadInvoices();
  }, [status, search, reloadCount]);

  // search by patient name
  function handleSearch(e: FormEvent) {
    e.preventDefault();
    setSearch(searchText);
  }

  return (
    <PortalPage
      eyebrow="Front Desk"
      title="Billing"
      description="Take payments on invoices for your office, and ask the admin to refund a payment made by mistake."
    >
      <form onSubmit={handleSearch} className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
        <Field label="Patient" type="search" placeholder="Patient name" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="unpaid">Has a balance</option>
          <option value="">All invoices</option>
          <option value="Pending">Pending</option>
          <option value="Overdue">Overdue</option>
          <option value="Paid">Paid</option>
        </SelectField>
        <button type="submit" className={ADMIN_PRIMARY_BUTTON}>Search</button>
      </form>

      <PageError message={error} />

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Visit</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Loading invoices...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">No invoices found.</td></tr>
              ) : (
                invoices.map((i) => (
                  <tr key={i.invoiceId} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-slate-500">#{i.invoiceId}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-navy">{i.patientName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{i.appointmentDate} · Dr. {i.doctorName}</td>
                    <td className="px-4 py-3 text-slate-700">{money(i.amount)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{money(i.balance)}</td>
                    <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <TextButton onClick={() => setOpenInvoiceId(i.invoiceId)}>Open</TextButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {openInvoiceId && (
        <InvoiceModal invoiceId={openInvoiceId} onClose={() => setOpenInvoiceId(null)} onChanged={() => setReloadCount(reloadCount + 1)} />
      )}
    </PortalPage>
  );
}

function InvoiceModal({ invoiceId, onClose, onChanged }: { invoiceId: number; onClose: () => void; onChanged: () => void }) {
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [paymentTypes, setPaymentTypes] = useState<{ paymentTypeId: number; name: string }[]>([]);
  const [paymentTypeId, setPaymentTypeId] = useState("");
  const [amount, setAmount] = useState("");
  const [refundPayment, setRefundPayment] = useState<Payment | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  // load the invoice and payment types
  useEffect(() => {
    async function loadInvoice() {
      try {
        const invoiceRes = await api.get<InvoiceDetail>(`/api/receptionist/invoices/${invoiceId}`);
        setInvoice(invoiceRes.data);
        const typesRes = await api.get("/api/receptionist/payment-types");
        setPaymentTypes(typesRes.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    loadInvoice();
  }, [invoiceId, reloadCount]);

  // reload after a change
  function handleChanged(text: string) {
    setMessage(text);
    setReloadCount(reloadCount + 1);
    onChanged();
  }

  // take a payment
  async function takePayment(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await api.post(`/api/receptionist/invoices/${invoiceId}/payments`, { paymentTypeId: Number(paymentTypeId), amount });
      setAmount("");
      handleChanged("Payment recorded.");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // cancel a refund request made by mistake
  async function cancelRequest(payment: Payment) {
    if (!window.confirm(`Cancel the refund request for the ${money(payment.amountPaid)} payment?`)) return;
    setError("");
    setMessage("");
    try {
      await api.patch(`/api/receptionist/payments/${payment.paymentId}/cancel-request`);
      handleChanged("Refund request cancelled.");
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <Modal title={`Invoice #${invoiceId}`} onClose={onClose}>
      {!invoice ? (
        error ? <ErrorText message={error} /> : <p className="text-sm text-slate-500">Loading invoice...</p>
      ) : (
        <div className="space-y-5 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={invoice.status} />
            <span className="text-slate-700">
              {invoice.patientName} (ID {formatId(invoice.patientId)}) · visit {invoice.appointmentDate} with Dr. {invoice.doctorName}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Amount</p><p className="font-semibold text-navy">{money(invoice.amount)}</p></div>
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Paid</p><p className="font-semibold text-navy">{money(invoice.paid)}</p></div>
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Balance</p><p className="font-semibold text-navy">{money(invoice.balance)}</p></div>
          </div>

          <Section title="Charges">
            <InvoiceLines items={invoice.items} />
          </Section>

          <Section title="Payments">
            {invoice.payments.length === 0 ? (
              <p className="text-slate-500">No payments yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {invoice.payments.map((p) => (
                  <li key={p.paymentId} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span className="text-slate-700">
                      {money(p.amountPaid)} · {p.paymentType} · {p.paymentDate}
                      {p.handledBy && ` · taken by ${p.handledBy}`}
                    </span>
                    <span className="flex items-center gap-3">
                      <StatusBadge status={p.status === "Requested" ? "Refund Requested" : p.status} />
                      {p.status === "Completed" && <TextButton danger onClick={() => setRefundPayment(p)}>Request Refund</TextButton>}
                      {p.status === "Requested" && <TextButton onClick={() => cancelRequest(p)}>Cancel Request</TextButton>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {Number(invoice.balance) > 0 && (
            <form onSubmit={takePayment} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <SelectField label="Payment type" required value={paymentTypeId} onChange={(e) => setPaymentTypeId(e.target.value)}>
                <option value="">Choose one</option>
                {paymentTypes.map((t) => (
                  <option key={t.paymentTypeId} value={t.paymentTypeId}>{t.name}</option>
                ))}
              </SelectField>
              <Field label="Amount" required inputMode="decimal" placeholder={invoice.balance} value={amount} onChange={(e) => setAmount(e.target.value)} />
              <PrimaryButton disabled={saving}>{saving ? "Saving..." : "Take Payment"}</PrimaryButton>
            </form>
          )}

          <ErrorText message={error} />
          <SuccessText message={message} />
        </div>
      )}

      {refundPayment && (
        <RefundRequestModal
          payment={refundPayment}
          onClose={() => setRefundPayment(null)}
          onSaved={() => handleChanged("Refund requested. The admin will approve or deny it.")}
        />
      )}
    </Modal>
  );
}

function RefundRequestModal({ payment, onClose, onSaved }: { payment: Payment; onClose: () => void; onSaved: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // send the refund request to the admin
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.patch(`/api/receptionist/payments/${payment.paymentId}/request-refund`, { reason });
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Request Refund" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-700">
          {money(payment.amountPaid)} {payment.paymentType} payment from {payment.paymentDate}. The admin has to approve the refund.
        </p>
        <Field label="Reason" required placeholder="e.g. Charged twice by mistake" value={reason} onChange={(e) => setReason(e.target.value)} />
        <ErrorText message={error} />
        <FormActions saving={saving} onCancel={onClose} saveLabel="Send Request" />
      </form>
    </Modal>
  );
}
