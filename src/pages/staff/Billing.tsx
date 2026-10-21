import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { BillingSummary } from "../../components/BillingSummary";
import { useAuth } from "../../context/AuthContext";
import { authErrorMessage } from "../../services/authApi";
import {
  createInvoice,
  getBilling,
  getPaymentTypes,
  getUninvoicedAppointments,
  money,
  recordPayment,
} from "../../services/billingApi";
import { getPatients } from "../../services/nursingApi";
import type { BillingData, Patient, PaymentType, UninvoicedAppointment } from "../../types";

// Billing (receptionists only): pick a patient, see their balance, bill
// completed visits and record payments.
export function StaffBilling() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [patientList, types] = await Promise.all([getPatients(), getPaymentTypes()]);
        setPatients(patientList);
        setPaymentTypes(types);
      } catch {
        setError("Could not load patients.");
      }
    }
    loadData();
  }, []);

  const filtered = patients.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Billing</h1>
      <p className="mt-1 text-sm text-gray-500">Bill completed visits and record payments.</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid gap-6 md:grid-cols-[18rem_1fr]">
        <div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
            className="mb-3 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <ul className="space-y-1">
            {filtered.map((p) => (
              <li key={p.patientId}>
                <button
                  type="button"
                  onClick={() => setSelectedId(p.patientId)}
                  className={`w-full rounded px-3 py-2 text-left text-sm ${
                    p.patientId === selectedId ? "bg-blue-50 font-medium" : "hover:bg-gray-50"
                  }`}
                >
                  {p.lastName}, {p.firstName}
                  <span className="ml-2 text-xs text-gray-500">#{p.patientId}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded border border-gray-200 bg-white p-4">
          {selectedId ? (
            // key: a fresh panel per patient, so one patient's half-filled
            // forms or billing never show under another's name.
            <PatientBillingPanel key={selectedId} patientId={selectedId} paymentTypes={paymentTypes} />
          ) : (
            <p className="text-sm text-gray-500">Select a patient.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PatientBillingPanel({ patientId, paymentTypes }: { patientId: number; paymentTypes: PaymentType[] }) {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [uninvoiced, setUninvoiced] = useState<UninvoicedAppointment[]>([]);
  const [error, setError] = useState("");
  // Same reload trick as PatientChart: bumping this re-runs the effect.
  const [reloadCount, setReloadCount] = useState(0);
  const reload = () => setReloadCount((n) => n + 1);

  useEffect(() => {
    // Ignore a slow response for a patient who's no longer selected.
    let ignore = false;
    async function loadBilling() {
      try {
        setError("");
        const [data, visits] = await Promise.all([getBilling(patientId), getUninvoicedAppointments(patientId)]);
        if (!ignore) {
          setBilling(data);
          setUninvoiced(visits);
        }
      } catch {
        if (!ignore) setError("Could not load this patient's billing.");
      }
    }
    loadBilling();
    return () => {
      ignore = true;
    };
  }, [patientId, reloadCount]);

  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!billing) return <p className="text-sm text-gray-500">Loading billing…</p>;

  const unpaid = billing.invoices.filter((i) => i.status !== "Paid");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <CreateInvoiceForm visits={uninvoiced} onSaved={reload} />
        <RecordPaymentForm invoices={unpaid} paymentTypes={paymentTypes} onSaved={reload} />
      </div>
      <BillingSummary billing={billing} />
    </div>
  );
}

function CreateInvoiceForm({ visits, onSaved }: { visits: UninvoicedAppointment[]; onSaved: () => void }) {
  const { user } = useAuth();
  const [appointmentId, setAppointmentId] = useState("");
  const [amount, setAmount] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    try {
      await createInvoice(user.id, Number(appointmentId), Number(amount));
      setAppointmentId("");
      setAmount("");
      onSaved();
    } catch (err) {
      alert(`Could not create invoice: ${authErrorMessage(err)}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded border border-gray-200 bg-gray-50 p-3">
      <h3 className="text-sm font-semibold text-gray-900">Create invoice</h3>
      {visits.length === 0 ? (
        <p className="text-sm text-gray-500">No completed visits waiting to be billed.</p>
      ) : (
        <>
          <select
            required
            value={appointmentId}
            onChange={(e) => setAppointmentId(e.target.value)}
            className="block w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm"
          >
            <option value="">Select a completed visit…</option>
            {visits.map((v) => (
              <option key={v.appointmentId} value={v.appointmentId}>
                {v.appointmentDate} · {v.specialty} · {v.doctorName}
              </option>
            ))}
          </select>
          <MoneyInput value={amount} onChange={setAmount} />
          <button
            type="submit"
            className="w-full rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Create invoice
          </button>
        </>
      )}
    </form>
  );
}

function RecordPaymentForm({
  invoices,
  paymentTypes,
  onSaved,
}: {
  invoices: BillingData["invoices"];
  paymentTypes: PaymentType[];
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [invoiceId, setInvoiceId] = useState("");
  const [paymentTypeId, setPaymentTypeId] = useState("");
  const [amount, setAmount] = useState("");

  // Picking an invoice fills in its full balance; the receptionist can
  // lower it for a partial payment.
  function selectInvoice(id: string) {
    setInvoiceId(id);
    const invoice = invoices.find((i) => String(i.invoiceId) === id);
    setAmount(invoice ? invoice.balance : "");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    try {
      await recordPayment(user.id, Number(invoiceId), Number(paymentTypeId), Number(amount));
      setInvoiceId("");
      setPaymentTypeId("");
      setAmount("");
      onSaved();
    } catch (err) {
      alert(`Could not record payment: ${authErrorMessage(err)}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded border border-gray-200 bg-gray-50 p-3">
      <h3 className="text-sm font-semibold text-gray-900">Record payment</h3>
      {invoices.length === 0 ? (
        <p className="text-sm text-gray-500">No unpaid invoices.</p>
      ) : (
        <>
          <select
            required
            value={invoiceId}
            onChange={(e) => selectInvoice(e.target.value)}
            className="block w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm"
          >
            <option value="">Select an invoice…</option>
            {invoices.map((i) => (
              <option key={i.invoiceId} value={i.invoiceId}>
                #{i.invoiceId} · visit {i.appointmentDate} · owes {money(i.balance)}
              </option>
            ))}
          </select>
          <select
            required
            value={paymentTypeId}
            onChange={(e) => setPaymentTypeId(e.target.value)}
            className="block w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm"
          >
            <option value="">Payment method…</option>
            {paymentTypes.map((t) => (
              <option key={t.paymentTypeId} value={t.paymentTypeId}>
                {t.name}
              </option>
            ))}
          </select>
          <MoneyInput value={amount} onChange={setAmount} />
          <button
            type="submit"
            className="w-full rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Record payment
          </button>
        </>
      )}
    </form>
  );
}

function MoneyInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs text-gray-700">
      Amount ($)
      <input
        required
        type="number"
        min="0.01"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm"
      />
    </label>
  );
}
