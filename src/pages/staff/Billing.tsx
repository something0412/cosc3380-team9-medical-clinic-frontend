import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BillingSummary } from "../../components/BillingSummary";
import { useAuth } from "../../context/AuthContext";
import { authErrorMessage } from "../../services/authApi";
import {
  createInvoice,
  getBilling,
  getInvoiceEstimate,
  getPaymentTypes,
  getUninvoicedAppointments,
  getWorklist,
  money,
  recordPayment,
} from "../../services/billingApi";
import { getPatients } from "../../services/nursingApi";
import type {
  BillingData,
  InvoiceEstimate,
  Patient,
  PaymentType,
  UninvoicedAppointment,
  WorklistInvoice,
} from "../../types";

const receiptPath = (paymentId: number) => `/staff/billing/receipts/${paymentId}`;

// Billing (receptionists only). Two views:
//   - Worklist: the office's unpaid invoices, to follow up on.
//   - Patient: one patient's billing - bill completed visits (at least the
//     $50 check-in fee plus lab tests) and record payments.
// "Bill visit" on the Front Desk opens the Patient view with that patient
// and visit already chosen (?patientId=&appointmentId=).
export function StaffBilling() {
  const [searchParams] = useSearchParams();
  const preselectedPatient = Number(searchParams.get("patientId")) || null;
  const preselectedVisit = Number(searchParams.get("appointmentId")) || null;

  const [view, setView] = useState<"Worklist" | "Patient">(preselectedPatient ? "Patient" : "Worklist");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(preselectedPatient);
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

  function openPatient(patientId: number) {
    setSelectedId(patientId);
    setView("Patient");
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Billing</h1>
      <p className="mt-1 text-sm text-gray-500">Bill completed visits and record payments.</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-4 flex gap-1 border-b border-gray-200">
        {(["Worklist", "Patient"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`px-3 py-2 text-sm ${
              view === v ? "border-b-2 border-blue-600 font-medium text-blue-700" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {v === "Worklist" ? "Unpaid invoices" : "Patient billing"}
          </button>
        ))}
      </div>

      {view === "Worklist" ? (
        <Worklist onOpen={openPatient} />
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-[18rem_1fr]">
          <div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name"
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
              <PatientBillingPanel
                key={selectedId}
                patientId={selectedId}
                paymentTypes={paymentTypes}
                preselectedVisit={selectedId === preselectedPatient ? preselectedVisit : null}
              />
            ) : (
              <p className="text-sm text-gray-500">Select a patient.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// The office's Pending invoices, oldest first.
function Worklist({ onOpen }: { onOpen: (patientId: number) => void }) {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<WorklistInvoice[] | null>(null);

  useEffect(() => {
    if (!user?.officeId) return;
    getWorklist(user.officeId)
      .then(setInvoices)
      .catch(() => setInvoices([]));
  }, [user?.officeId]);

  if (!invoices) return <p className="mt-6 text-sm text-gray-500">Loading…</p>;
  if (invoices.length === 0) return <p className="mt-6 text-sm text-gray-500">No unpaid invoices.</p>;

  return (
    <div className="mt-6 overflow-x-auto rounded border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-2">Invoice</th>
            <th className="p-2">Patient</th>
            <th className="p-2">Visit</th>
            <th className="p-2">Issued</th>
            <th className="p-2">Amount</th>
            <th className="p-2">Balance</th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {invoices.map((i) => (
            <tr key={i.invoiceId} className="border-b">
              <td className="p-2">#{i.invoiceId}</td>
              <td className="p-2">{i.patientName}</td>
              <td className="p-2">{i.appointmentDate}</td>
              <td className="p-2">{i.issueDate}</td>
              <td className="p-2">{money(i.amount)}</td>
              <td className="p-2 font-medium">{money(i.balance)}</td>
              <td className="p-2">
                <button type="button" onClick={() => onOpen(i.patientId)} className="text-blue-700 hover:underline">
                  Open
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PatientBillingPanel({
  patientId,
  paymentTypes,
  preselectedVisit,
}: {
  patientId: number;
  paymentTypes: PaymentType[];
  preselectedVisit: number | null;
}) {
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
        <CreateInvoiceForm visits={uninvoiced} preselectedVisit={preselectedVisit} onSaved={reload} />
        <RecordPaymentForm invoices={unpaid} paymentTypes={paymentTypes} onSaved={reload} />
      </div>
      <BillingSummary billing={billing} receiptPath={receiptPath} />
    </div>
  );
}

// Bill one completed visit. Picking a visit loads its estimate: the $50
// check-in fee plus each lab test. The amount starts at that minimum and
// can be raised, never lowered (the backend enforces it too).
function CreateInvoiceForm({
  visits,
  preselectedVisit,
  onSaved,
}: {
  visits: UninvoicedAppointment[];
  preselectedVisit: number | null;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [appointmentId, setAppointmentId] = useState(
    preselectedVisit && visits.some((v) => v.appointmentId === preselectedVisit) ? String(preselectedVisit) : "",
  );
  const [estimate, setEstimate] = useState<InvoiceEstimate | null>(null);
  const [amount, setAmount] = useState("");

  // Load the estimate for the chosen visit.
  useEffect(() => {
    if (!appointmentId) return;
    let ignore = false;
    getInvoiceEstimate(Number(appointmentId))
      .then((data) => {
        if (!ignore) {
          setEstimate(data);
          setAmount(data.minimumAmount);
        }
      })
      .catch(() => {
        if (!ignore) setEstimate(null);
      });
    return () => {
      ignore = true;
    };
  }, [appointmentId]);

  function chooseVisit(id: string) {
    setAppointmentId(id);
    setEstimate(null);
    setAmount("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    try {
      await createInvoice(user.id, Number(appointmentId), Number(amount));
      chooseVisit("");
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
            onChange={(e) => chooseVisit(e.target.value)}
            className="block w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm"
          >
            <option value="">Select a completed visit…</option>
            {visits.map((v) => (
              <option key={v.appointmentId} value={v.appointmentId}>
                {v.appointmentDate} · {v.specialty} · {v.doctorName}
              </option>
            ))}
          </select>

          {estimate && (
            <ul className="text-xs text-gray-700">
              <li>Check-in fee: {money(estimate.checkInFee)}</li>
              {estimate.labs.map((lab) => (
                <li key={lab.labOrderId}>
                  {lab.name}: {money(lab.cost)}
                </li>
              ))}
              <li className="font-medium">Minimum: {money(estimate.minimumAmount)}</li>
            </ul>
          )}

          <MoneyInput value={amount} onChange={setAmount} min={estimate?.minimumAmount} />
          <button
            type="submit"
            disabled={!estimate}
            className="w-full rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
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
  // The payment just recorded, for its "Print receipt" link.
  const [lastPaymentId, setLastPaymentId] = useState<number | null>(null);

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
      const payment = await recordPayment(user.id, Number(invoiceId), Number(paymentTypeId), Number(amount));
      setLastPaymentId(payment.paymentId);
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
      {lastPaymentId && (
        <p className="text-sm text-green-700">
          Payment recorded.{" "}
          <Link to={receiptPath(lastPaymentId)} className="font-medium text-blue-700 hover:underline">
            Print receipt
          </Link>
        </p>
      )}
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

function MoneyInput({ value, onChange, min = "0.01" }: { value: string; onChange: (value: string) => void; min?: string }) {
  return (
    <label className="block text-xs text-gray-700">
      Amount ($)
      <input
        required
        type="number"
        min={min}
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm"
      />
    </label>
  );
}
