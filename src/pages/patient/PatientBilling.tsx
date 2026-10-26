import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { flushSync } from "react-dom";
import { api, apiErrorMessage } from "../../api";
import { CardPaymentForm } from "../../components/CardPaymentForm";
import type { CardPayment } from "../../components/CardPaymentForm";
import { ErrorText, Field } from "../../components/FormControls";
import { InvoiceLines } from "../../components/InvoiceLines";
import type { InvoiceItem } from "../../components/InvoiceLines";
import { InvoiceReport } from "../../components/InvoiceReport";
import { Modal } from "../../components/Modal";
import { PageError, PortalPage } from "../../components/PortalPage";
import { printReport } from "../../utils/printReport";
import { PrimaryButton, Section, StatusBadge, SuccessText, TextButton } from "../../components/ProfileUI";
import { StatCard } from "../../components/StatCard";
import { useAuth } from "../../context/AuthContext";

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
  items: InvoiceItem[];
}

interface Payment {
  paymentId: number;
  invoiceId: number;
  paymentDate: string;
  amountPaid: string;
  paymentType: string;
  status: string;
}

interface BillingData {
  invoices: Invoice[];
  payments: Payment[];
  outstandingBalance: string;
}

interface Insurance {
  provider: string;
  policyNumber: string;
  status: string;
}

const money = (amount: string | number) => `$${Number(amount).toFixed(2)}`;

export function PatientBilling() {
  const { user } = useAuth();
  const patientId = user?.role === "patient" ? user.id : null;
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [insurance, setInsurance] = useState<Insurance | null>(null);
  const [paying, setPaying] = useState<Invoice | null>(null);
  const [printing, setPrinting] = useState<Invoice | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  // load my invoices, payments, and insurance
  useEffect(() => {
    async function loadBilling() {
      if (!patientId) return;
      try {
        const res = await api.get<BillingData>(`/api/patient/${patientId}/billing`);
        setBilling(res.data);
        const profileRes = await api.get<{ insurance: Insurance | null }>(`/api/patient/${patientId}/profile`);
        setInsurance(profileRes.data.insurance);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    loadBilling();
  }, [patientId, reloadCount]);

  // reload after paying or saving insurance
  function handleDone(text: string) {
    setMessage(text);
    setReloadCount(reloadCount + 1);
  }

  // show one invoice as a report, then open the print window
  function downloadInvoice(invoice: Invoice) {
    flushSync(() => setPrinting(invoice));
    printReport(`Invoice ${invoice.invoiceId}`);
  }

  return (
    <PortalPage eyebrow="Patient Portal" title="Billing & Payments" description="Your invoices, what you still owe, and your payment history.">
      <PageError message={error} />
      <SuccessText message={message} />
      {!billing && !error && <p className="text-slate-500">Loading billing...</p>}

      {billing && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard label="Outstanding Balance" value={money(billing.outstandingBalance)} />
            <StatCard label="Invoices" value={String(billing.invoices.length)} />
            <StatCard
              label="Insurance"
              value={insurance ? insurance.status : "None"}
              note={insurance ? `${insurance.provider} · ${insurance.policyNumber}` : "Add it when you pay an invoice"}
            />
          </div>

          {insurance?.status === "Verified" && (
            <p className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
              Your {insurance.provider} insurance is verified, so new charges are billed to it automatically.
            </p>
          )}

          <Section title="My Invoices">
            {billing.invoices.length === 0 ? (
              <p className="text-slate-500">No invoices.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Invoice</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Paid</th>
                      <th className="px-4 py-3">Balance</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {billing.invoices.map((i) => (
                      <tr key={i.invoiceId}>
                        <td className="px-4 py-3 font-mono text-slate-500">#{i.invoiceId}</td>
                        <td className="px-4 py-3 text-slate-700">{i.issueDate}</td>
                        <td className="px-4 py-3 text-slate-700">{money(i.amount)}</td>
                        <td className="px-4 py-3 text-slate-700">{money(i.paid)}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{money(i.balance)}</td>
                        <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          {Number(i.balance) > 0 && <TextButton onClick={() => setPaying(i)}>Pay</TextButton>}
                          <TextButton className="ml-4" onClick={() => downloadInvoice(i)}>Download PDF</TextButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {billing.invoices.length > 0 && (
            <Section title="What Each Invoice Is For">
              <div className="space-y-5">
                {billing.invoices.map((i) => (
                  <div key={i.invoiceId}>
                    <p className="mb-1 text-sm font-semibold text-slate-900">
                      Invoice #{i.invoiceId} · {i.issueDate}
                    </p>
                    <InvoiceLines items={i.items} />
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section title="Payment History">
            {billing.payments.length === 0 ? (
              <p className="text-slate-500">No payments.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Invoice</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {billing.payments.map((p) => (
                      <tr key={p.paymentId}>
                        <td className="px-4 py-3 text-slate-700">{p.paymentDate}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">#{p.invoiceId}</td>
                        <td className="px-4 py-3 text-slate-700">{money(p.amountPaid)}</td>
                        <td className="px-4 py-3 text-slate-700">{p.paymentType}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={p.status === "Requested" ? "Refund Requested" : p.status === "Completed" ? "Paid" : p.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </>
      )}

      {paying && patientId && (
        <PayModal
          patientId={patientId}
          invoice={paying}
          insurance={insurance}
          onClose={() => setPaying(null)}
          onDone={handleDone}
        />
      )}

      {printing && billing && (
        <InvoiceReport invoice={{ ...printing, payments: billing.payments.filter((p) => p.invoiceId === printing.invoiceId) }} />
      )}
    </PortalPage>
  );
}

function PayModal({
  patientId,
  invoice,
  insurance,
  onClose,
  onDone,
}: {
  patientId: number;
  invoice: Invoice;
  insurance: Insurance | null;
  onClose: () => void;
  onDone: (text: string) => void;
}) {
  const [tab, setTab] = useState("card");

  return (
    <Modal title={`Pay Invoice #${invoice.invoiceId}`} onClose={onClose}>
      <p className="mb-4 text-sm text-slate-700">
        Balance: <span className="font-semibold text-navy">{money(invoice.balance)}</span>
      </p>

      <div className="mb-5 flex gap-6 border-b border-slate-200">
        {[
          ["card", "Pay by Card"],
          ["insurance", "Bill My Insurance"],
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

      {tab === "card" ? (
        <CardForm patientId={patientId} invoice={invoice} onClose={onClose} onDone={onDone} />
      ) : (
        <InsuranceForm patientId={patientId} insurance={insurance} onClose={onClose} onDone={onDone} />
      )}
    </Modal>
  );
}

function CardForm({ patientId, invoice, onClose, onDone }: { patientId: number; invoice: Invoice; onClose: () => void; onDone: (text: string) => void }) {
  // pay by card
  async function payByCard(payment: CardPayment) {
    await api.post(`/api/patient/${patientId}/invoices/${invoice.invoiceId}/payments`, payment);
    onDone(`Payment of ${money(payment.amount)} received. Thank you!`);
    onClose();
  }

  return <CardPaymentForm balance={invoice.balance} onPay={payByCard} />;
}

function InsuranceForm({
  patientId,
  insurance,
  onClose,
  onDone,
}: {
  patientId: number;
  insurance: Insurance | null;
  onClose: () => void;
  onDone: (text: string) => void;
}) {
  const [provider, setProvider] = useState(insurance?.provider ?? "");
  const [policyNumber, setPolicyNumber] = useState(insurance?.policyNumber ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // save my insurance so the clinic can verify it and bill it
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.put(`/api/patient/${patientId}/insurance`, { provider, policyNumber });
      onDone("Insurance saved. We'll contact your insurance, and once it's verified this invoice is billed to them.");
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (insurance?.status === "Verified") {
    return (
      <p className="text-sm text-slate-700">
        Your {insurance.provider} insurance is verified and pays new charges automatically. This balance is left after insurance, so
        please pay it by card or at the front desk.
      </p>
    );
  }

  if (insurance?.status === "Pending") {
    return (
      <p className="text-sm text-slate-700">
        We have your {insurance.provider} insurance (policy {insurance.policyNumber}) and are checking it with them. Once it's verified,
        this invoice is billed to your insurance automatically.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-slate-700">
        {insurance?.status === "Denied"
          ? `Your ${insurance.provider} insurance couldn't be verified. Check the details below and save them again.`
          : "Fill in your insurance and we'll contact them. Once your insurance is verified, this invoice is billed to them."}
      </p>
      <Field label="Insurance Provider" required placeholder="e.g. Blue Cross Blue Shield" value={provider} onChange={(e) => setProvider(e.target.value)} />
      <Field label="Policy Number" required value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} />
      <ErrorText message={error} />
      <PrimaryButton disabled={saving}>{saving ? "Saving..." : "Save Insurance"}</PrimaryButton>
    </form>
  );
}
