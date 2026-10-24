import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { ErrorText, Field, SelectField } from "../../components/FormControls";
import { Modal } from "../../components/Modal";
import { FormActions, Section, StatusBadge, SuccessText, TextButton } from "../../components/ProfileUI";

interface Invoice {
  invoiceId: number;
  patientId: number;
  patientName: string;
  visitDate: string;
  doctorName: string;
  issueDate: string;
  amount: number;
  paid: number;
  balance: number;
  status: string;
}

interface BillableVisit {
  appointmentId: number;
  patientId: number;
  patientName: string;
  date: string;
  doctorName: string;
  specialty: string;
  labCost: number;
}

interface PaymentType {
  paymentTypeId: number;
  name: string;
}

const FILTERS = [
  { key: "unpaid", label: "Unpaid" },
  { key: "Pending", label: "Pending" },
  { key: "Overdue", label: "Overdue" },
  { key: "Paid", label: "Paid" },
  { key: "all", label: "All" },
];

export function ReceptionistBilling() {
  const [status, setStatus] = useState("unpaid");
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [visits, setVisits] = useState<BillableVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const [billVisit, setBillVisit] = useState<BillableVisit | null>(null);
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);

  // load invoices for the chosen filter
  useEffect(() => {
    async function loadInvoices() {
      try {
        const res = await api.get<Invoice[]>("/api/receptionist/invoices", { params: { status, search } });
        setInvoices(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadInvoices();
  }, [status, search, reloadCount]);

  // load visits that still need an invoice
  useEffect(() => {
    async function loadVisits() {
      try {
        const res = await api.get<BillableVisit[]>("/api/receptionist/billable-appointments");
        setVisits(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    loadVisits();
  }, [reloadCount]);

  // search by patient name
  function handleSearch(e: FormEvent) {
    e.preventDefault();
    setSearch(searchText);
  }

  // reload after a change and show what happened
  function handleSaved(text: string) {
    setMessage(text);
    setError("");
    setReloadCount(reloadCount + 1);
  }

  // mark an invoice overdue
  async function markOverdue(invoiceId: number) {
    if (!window.confirm(`Mark invoice #${invoiceId} as overdue?`)) return;
    setError("");
    setMessage("");
    try {
      await api.patch(`/api/receptionist/invoices/${invoiceId}/overdue`);
      handleSaved(`Invoice #${invoiceId} marked overdue.`);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="mt-1 text-gray-600">Invoices and payments for your office.</p>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      <SuccessText message={message} />

      <Section title={`Visits to Bill (${visits.length})`}>
        {visits.length === 0 ? (
          <p className="text-gray-500">Every completed visit has an invoice.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-2 pr-4 font-medium">Visit Date</th>
                  <th className="py-2 pr-4 font-medium">Patient</th>
                  <th className="py-2 pr-4 font-medium">Doctor</th>
                  <th className="py-2 pr-4 font-medium">Specialty</th>
                  <th className="py-2 pr-4 font-medium">Lab Costs</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v) => (
                  <tr key={v.appointmentId} className="border-b last:border-0">
                    <td className="py-2 pr-4">{v.date}</td>
                    <td className="py-2 pr-4">
                      <Link to={`/staff/reception/patients/${v.patientId}`} className="font-medium text-blue-600 hover:underline">
                        {v.patientName}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">{v.doctorName}</td>
                    <td className="py-2 pr-4">{v.specialty}</td>
                    <td className="py-2 pr-4">${v.labCost.toFixed(2)}</td>
                    <td className="py-2">
                      <TextButton onClick={() => setBillVisit(v)}>Create Invoice</TextButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <div className="flex gap-6 border-b border-gray-200">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setStatus(f.key)}
            className={`-mb-px border-b-2 pb-3 text-sm font-medium ${
              status === f.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch} className="flex max-w-md gap-2">
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search by patient name"
          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearchText("");
              setSearch("");
            }}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </form>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full whitespace-nowrap text-left text-sm">
          <thead className="bg-gray-50">
            <tr className="border-b text-gray-500">
              <th className="p-3 font-medium">Invoice #</th>
              <th className="p-3 font-medium">Patient</th>
              <th className="p-3 font-medium">Visit</th>
              <th className="p-3 font-medium">Issued</th>
              <th className="p-3 font-medium">Amount</th>
              <th className="p-3 font-medium">Paid</th>
              <th className="p-3 font-medium">Balance</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="p-3 text-gray-500">Loading invoices...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={9} className="p-3 text-gray-500">{search ? `No invoices for "${search}".` : "No invoices."}</td></tr>
            ) : (
              invoices.map((i) => (
                <tr key={i.invoiceId} className="border-b last:border-0">
                  <td className="p-3">{i.invoiceId}</td>
                  <td className="p-3">
                    <Link to={`/staff/reception/patients/${i.patientId}`} className="font-medium text-blue-600 hover:underline">
                      {i.patientName}
                    </Link>
                  </td>
                  <td className="p-3">{i.visitDate} · {i.doctorName}</td>
                  <td className="p-3">{i.issueDate}</td>
                  <td className="p-3">${i.amount.toFixed(2)}</td>
                  <td className="p-3">${i.paid.toFixed(2)}</td>
                  <td className={`p-3 ${i.balance > 0 ? "font-medium text-red-600" : ""}`}>${i.balance.toFixed(2)}</td>
                  <td className="p-3"><StatusBadge status={i.status} /></td>
                  <td className="space-x-3 p-3">
                    {i.status !== "Paid" && <TextButton onClick={() => setPayInvoice(i)}>Take Payment</TextButton>}
                    {i.status === "Pending" && <TextButton danger onClick={() => markOverdue(i.invoiceId)}>Mark Overdue</TextButton>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {billVisit && (
        <InvoiceModal visit={billVisit} onClose={() => setBillVisit(null)} onSaved={() => handleSaved(`Invoice created for ${billVisit.patientName}.`)} />
      )}
      {payInvoice && (
        <PaymentModal
          invoice={payInvoice}
          onClose={() => setPayInvoice(null)}
          onSaved={(paidOff) => handleSaved(paidOff ? `Invoice #${payInvoice.invoiceId} is paid in full.` : `Payment saved for invoice #${payInvoice.invoiceId}.`)}
        />
      )}
    </div>
  );
}

function InvoiceModal({ visit, onClose, onSaved }: { visit: BillableVisit; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // create the invoice
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/api/receptionist/invoices", { appointmentId: visit.appointmentId, amount: Number(amount) });
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Create Invoice" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-700">
          {visit.patientName} · {visit.date} · Dr. {visit.doctorName} ({visit.specialty})
        </p>
        {visit.labCost > 0 && <p className="text-sm text-gray-500">Lab tests on this visit cost ${visit.labCost.toFixed(2)}.</p>}
        <Field label="Amount ($)" type="number" min="0" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
        <ErrorText message={error} />
        <FormActions saving={saving} onCancel={onClose} saveLabel="Create Invoice" />
      </form>
    </Modal>
  );
}

function PaymentModal({ invoice, onClose, onSaved }: { invoice: Invoice; onClose: () => void; onSaved: (paidOff: boolean) => void }) {
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [paymentTypeId, setPaymentTypeId] = useState("");
  const [amount, setAmount] = useState(invoice.balance.toFixed(2));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // load payment types
  useEffect(() => {
    async function loadPaymentTypes() {
      try {
        const res = await api.get<PaymentType[]>("/api/receptionist/payment-types");
        setPaymentTypes(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    loadPaymentTypes();
  }, []);

  // save the payment
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await api.post<{ paymentId: number; paidOff: boolean }>(`/api/receptionist/invoices/${invoice.invoiceId}/payments`, {
        paymentTypeId: Number(paymentTypeId),
        amount: Number(amount),
      });
      onSaved(res.data.paidOff);
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Take Payment · Invoice #${invoice.invoiceId}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-700">
          {invoice.patientName} owes <span className="font-semibold">${invoice.balance.toFixed(2)}</span> of ${invoice.amount.toFixed(2)}.
        </p>
        <SelectField label="Payment Type" required value={paymentTypeId} onChange={(e) => setPaymentTypeId(e.target.value)}>
          <option value="">Select a payment type</option>
          {paymentTypes.map((t) => (
            <option key={t.paymentTypeId} value={t.paymentTypeId}>{t.name}</option>
          ))}
        </SelectField>
        <Field label="Amount ($)" type="number" min="0.01" max={invoice.balance} step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} />
        <ErrorText message={error} />
        <FormActions saving={saving} onCancel={onClose} saveLabel="Save Payment" />
      </form>
    </Modal>
  );
}
