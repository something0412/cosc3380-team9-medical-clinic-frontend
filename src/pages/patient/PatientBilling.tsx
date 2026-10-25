import { useEffect, useState } from "react";
import { api, apiErrorMessage } from "../../api";
import { InvoiceLines } from "../../components/InvoiceLines";
import type { InvoiceItem } from "../../components/InvoiceLines";
import { PageError, PortalPage } from "../../components/PortalPage";
import { Section, StatusBadge } from "../../components/ProfileUI";
import { StatCard } from "../../components/StatCard";
import { useAuth } from "../../context/AuthContext";

interface Invoice {
  invoiceId: number;
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

const money = (amount: string | number) => `$${Number(amount).toFixed(2)}`;

export function PatientBilling() {
  const { user } = useAuth();
  const patientId = user?.role === "patient" ? user.id : null;
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [error, setError] = useState("");

  // load my invoices and payments
  useEffect(() => {
    async function loadBilling() {
      if (!patientId) return;
      try {
        const res = await api.get<BillingData>(`/api/patient/${patientId}/billing`);
        setBilling(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    loadBilling();
  }, [patientId]);

  return (
    <PortalPage eyebrow="Patient Portal" title="Billing & Payments" description="Your invoices, what you still owe, and your payment history.">
      <PageError message={error} />
      {!billing && !error && <p className="text-slate-500">Loading billing...</p>}

      {billing && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <StatCard label="Outstanding Balance" value={money(billing.outstandingBalance)} />
            <StatCard label="Invoices" value={String(billing.invoices.length)} />
          </div>

          <Section title="My Invoices">
            {billing.invoices.length === 0 ? (
              <p className="text-slate-500">No invoices.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Invoice</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Paid</th>
                      <th className="px-4 py-3">Balance</th>
                      <th className="px-4 py-3">Status</th>
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

          <p className="text-sm text-slate-500">Online payments aren't available yet. Pay at the front desk.</p>
        </>
      )}
    </PortalPage>
  );
}
