import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, apiErrorMessage } from "../../api";
import { ADMIN_PRIMARY_BUTTON } from "../../components/admin/styles";
import { CardPaymentForm } from "../../components/CardPaymentForm";
import type { CardPayment } from "../../components/CardPaymentForm";
import { ErrorText, Field, SelectField } from "../../components/FormControls";
import { InvoiceLines } from "../../components/InvoiceLines";
import type { InvoiceItem } from "../../components/InvoiceLines";
import { InvoiceReport } from "../../components/InvoiceReport";
import { Modal } from "../../components/Modal";
import { PageError, PortalPage } from "../../components/PortalPage";
import { printReport } from "../../utils/printReport";
import { FormActions, PrimaryButton, SecondaryButton, Section, StatusBadge, SuccessText, TextButton } from "../../components/ProfileUI";
import { formatId } from "../../utils/id";

interface Invoice {
  invoiceId: number;
  patientId: number;
  patientName: string;
  appointmentDate: string;
  doctorName: string;
  officeName: string;
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
  const [showPay, setShowPay] = useState(false);
  const [refundPayment, setRefundPayment] = useState<Payment | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  // load the invoice
  useEffect(() => {
    async function loadInvoice() {
      try {
        const invoiceRes = await api.get<InvoiceDetail>(`/api/receptionist/invoices/${invoiceId}`);
        setInvoice(invoiceRes.data);
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

          <div className="flex flex-wrap gap-2">
            {Number(invoice.balance) > 0 && <PrimaryButton type="button" onClick={() => setShowPay(true)}>Take Payment</PrimaryButton>}
            <SecondaryButton onClick={() => printReport(`Invoice ${invoice.invoiceId}`)}>Download PDF</SecondaryButton>
          </div>

          <ErrorText message={error} />
          <SuccessText message={message} />
          <InvoiceReport invoice={invoice} />
        </div>
      )}

      {showPay && invoice && (
        <PayModal
          invoice={invoice}
          onClose={() => setShowPay(false)}
          onDone={(text) => {
            setShowPay(false);
            handleChanged(text);
          }}
        />
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

interface Insurance {
  provider: string;
  policyNumber: string;
  status: string;
}

interface PaymentType {
  paymentTypeId: number;
  name: string;
}

// pay an invoice: the patient's insurance first, then card, then cash or check
function PayModal({ invoice, onClose, onDone }: { invoice: InvoiceDetail; onClose: () => void; onDone: (text: string) => void }) {
  const [tab, setTab] = useState("insurance");
  const [insurance, setInsurance] = useState<Insurance | null>(null);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  // load the patient's insurance and the payment types
  useEffect(() => {
    async function loadPaymentInfo() {
      try {
        const patientRes = await api.get<{ insurance: Insurance | null }>(`/api/receptionist/patients/${invoice.patientId}`);
        setInsurance(patientRes.data.insurance);
        const typesRes = await api.get<PaymentType[]>("/api/receptionist/payment-types");
        setPaymentTypes(typesRes.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadPaymentInfo();
  }, [invoice.patientId, reloadCount]);

  // the ID of a payment type by its name
  const typeId = (name: string) => paymentTypes.find((t) => t.name === name)?.paymentTypeId;

  // pay by card (card details are checked by the backend, never saved)
  async function payByCard(payment: CardPayment) {
    const { cardType, amount, ...card } = payment;
    await api.post(`/api/receptionist/invoices/${invoice.invoiceId}/payments`, { paymentTypeId: typeId(cardType), amount, card });
    onDone(`${cardType} payment of ${money(amount)} recorded.`);
  }

  return (
    <Modal title={`Take Payment · Invoice #${invoice.invoiceId}`} onClose={onClose}>
      <p className="mb-4 text-sm text-slate-700">
        {invoice.patientName} · balance <span className="font-semibold text-navy">{money(invoice.balance)}</span>
      </p>

      <div className="mb-5 flex gap-6 border-b border-slate-200">
        {[
          ["insurance", "Insurance"],
          ["card", "Card"],
          ["cash", "Cash or Check"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 pb-3 text-sm font-semibold ${
              tab === key ? "border-navy text-navy" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ErrorText message={error} />
      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : tab === "insurance" ? (
        <InsuranceTab
          invoice={invoice}
          insurance={insurance}
          insuranceTypeId={typeId("Insurance")}
          onChanged={() => setReloadCount(reloadCount + 1)}
          onDone={onDone}
        />
      ) : tab === "card" ? (
        <CardPaymentForm balance={invoice.balance} onPay={payByCard} />
      ) : (
        <CashForm invoice={invoice} paymentTypes={paymentTypes.filter((t) => t.name === "Cash" || t.name === "Check")} onDone={onDone} />
      )}
    </Modal>
  );
}

function InsuranceTab({
  invoice,
  insurance,
  insuranceTypeId,
  onChanged,
  onDone,
}: {
  invoice: InvoiceDetail;
  insurance: Insurance | null;
  insuranceTypeId: number | undefined;
  onChanged: () => void;
  onDone: (text: string) => void;
}) {
  const [provider, setProvider] = useState(insurance?.provider ?? "");
  const [policyNumber, setPolicyNumber] = useState(insurance?.policyNumber ?? "");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  // save the patient's insurance (it starts as Pending)
  async function saveInsurance(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.put(`/api/receptionist/patients/${invoice.patientId}/insurance`, { provider, policyNumber });
      setMessage("Insurance saved. Verify it with the insurer before billing it.");
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // verify or deny the insurance (verifying bills the patient's unpaid invoices to it)
  async function review(status: string) {
    if (!insurance) return;
    setError("");
    setSaving(true);
    try {
      await api.patch(`/api/receptionist/patients/${invoice.patientId}/insurance/status`, {
        status,
        provider: insurance.provider,
        policyNumber: insurance.policyNumber,
      });
      if (status === "Verified") {
        onDone(`${insurance.provider} insurance verified. The patient's unpaid invoices are billed to it.`);
      } else {
        setMessage("Insurance denied. Take the payment by card, cash or check.");
        onChanged();
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // bill what's left to the verified insurance
  async function billInsurance() {
    setError("");
    setSaving(true);
    try {
      await api.post(`/api/receptionist/invoices/${invoice.invoiceId}/payments`, { paymentTypeId: insuranceTypeId, amount: invoice.balance });
      onDone(`${money(invoice.balance)} billed to ${insurance?.provider} insurance.`);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 text-sm">
      {insurance ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <span>
            <span className="font-semibold text-slate-900">{insurance.provider}</span>
            <span className="text-slate-600"> · policy {insurance.policyNumber}</span>
          </span>
          <StatusBadge status={insurance.status} />
        </div>
      ) : (
        <p className="text-slate-700">This patient has no insurance on file.</p>
      )}

      {insurance?.status === "Verified" && (
        <>
          <p className="text-slate-700">The insurance is verified and can pay this invoice.</p>
          <PrimaryButton type="button" disabled={saving} onClick={billInsurance}>
            {saving ? "Billing..." : `Bill ${money(invoice.balance)} to Insurance`}
          </PrimaryButton>
        </>
      )}

      {insurance?.status === "Pending" && (
        <>
          <p className="text-slate-700">The insurance isn&apos;t verified yet, so it can&apos;t be used. Check it with the insurer, then verify or deny it.</p>
          <div className="flex gap-2">
            <PrimaryButton type="button" disabled={saving} onClick={() => review("Verified")}>Verify</PrimaryButton>
            <TextButton danger disabled={saving} onClick={() => review("Denied")}>Deny</TextButton>
          </div>
        </>
      )}

      {(!insurance || insurance.status === "Denied") && (
        <form onSubmit={saveInsurance} className="space-y-3">
          {insurance?.status === "Denied" && <p className="text-slate-700">The insurance was denied. Update it below, or pay by card, cash or check.</p>}
          <Field label="Insurance Provider" required value={provider} onChange={(e) => setProvider(e.target.value)} />
          <Field label="Policy Number" required value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} />
          <PrimaryButton disabled={saving}>{saving ? "Saving..." : "Save Insurance"}</PrimaryButton>
        </form>
      )}

      <ErrorText message={error} />
      <SuccessText message={message} />
    </div>
  );
}

function CashForm({ invoice, paymentTypes, onDone }: { invoice: InvoiceDetail; paymentTypes: PaymentType[]; onDone: (text: string) => void }) {
  const [paymentTypeId, setPaymentTypeId] = useState(paymentTypes[0] ? String(paymentTypes[0].paymentTypeId) : "");
  const [amount, setAmount] = useState(Number(invoice.balance).toFixed(2));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // record a cash or check payment
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post(`/api/receptionist/invoices/${invoice.invoiceId}/payments`, { paymentTypeId: Number(paymentTypeId), amount });
      onDone(`Payment of ${money(amount)} recorded.`);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField label="Paid With" required value={paymentTypeId} onChange={(e) => setPaymentTypeId(e.target.value)}>
          {paymentTypes.map((t) => (
            <option key={t.paymentTypeId} value={t.paymentTypeId}>{t.name}</option>
          ))}
        </SelectField>
        <Field label="Amount ($)" required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <ErrorText message={error} />
      <PrimaryButton disabled={saving}>{saving ? "Saving..." : `Record ${money(amount || 0)}`}</PrimaryButton>
    </form>
  );
}
