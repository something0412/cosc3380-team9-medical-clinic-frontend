import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, apiErrorMessage } from "../../api";
import { PageError, PortalPage } from "../../components/PortalPage";
import { ErrorText } from "../../components/FormControls";
import { Modal } from "../../components/Modal";
import { FormActions, SecondaryButton, PrimaryButton, StatusBadge } from "../../components/ProfileUI";

interface LabOrder {
  labOrderId: number;
  patientId: number;
  patientName: string;
  dob: string;
  testName: string;
  orderedBy: string;
  orderDate: string;
  status: string;
  resultNotes: string | null;
  performedBy: string | null;
  resultDate: string | null;
}

const TABS = [
  { key: "Ordered", label: "Waiting" },
  { key: "InProgress", label: "In Progress" },
  { key: "Completed", label: "Completed" },
  { key: "all", label: "All" },
];

export function LabOrders() {
  const [status, setStatus] = useState("Ordered");
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const [resultOrder, setResultOrder] = useState<LabOrder | null>(null);

  // load lab orders
  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await api.get<LabOrder[]>("/api/lab/orders", { params: { status, search } });
        setOrders(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [status, search, reloadCount]);

  // search by patient name
  function handleSearch(e: FormEvent) {
    e.preventDefault();
    setSearch(searchText);
  }

  // mark the sample as collected
  async function startOrder(order: LabOrder) {
    setError("");
    try {
      await api.patch(`/api/lab/orders/${order.labOrderId}/start`);
      setReloadCount(reloadCount + 1);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <PortalPage eyebrow="Laboratory" title="Lab Orders" description="Start an order when the sample is collected, then enter its result.">

      <div className="flex gap-6 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setStatus(t.key)}
            className={`-mb-px border-b-2 pb-3 text-sm font-medium ${
              status === t.key ? "border-navy text-navy" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch} className="flex max-w-md gap-2">
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search by patient name"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy-dark">
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearchText("");
              setSearch("");
            }}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </form>

      <PageError message={error} />

      <div className="rounded-lg border border-slate-200 bg-white">
        {loading ? (
          <p className="p-4 text-slate-500">Loading lab orders...</p>
        ) : orders.length === 0 ? (
          <p className="p-4 text-slate-500">{search ? `No lab orders for "${search}".` : "No lab orders here."}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {orders.map((o) => (
              <li key={o.labOrderId} className="p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">{o.testName}</span>
                    <StatusBadge status={o.status} />
                    <span className="text-slate-900">{o.patientName}</span>
                    <span className="text-slate-500">born {o.dob}</span>
                  </div>
                  <div className="flex gap-2">
                    {o.status === "Ordered" && (
                      <SecondaryButton type="button" onClick={() => startOrder(o)}>
                        Start
                      </SecondaryButton>
                    )}
                    {o.status === "InProgress" && (
                      <PrimaryButton type="button" onClick={() => setResultOrder(o)}>
                        Enter Result
                      </PrimaryButton>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-slate-500">
                  Ordered {o.orderDate} by Dr. {o.orderedBy}
                </p>
                {o.resultNotes && (
                  <div className="mt-2 rounded-lg bg-slate-50 p-3">
                    <p className="text-slate-800">{o.resultNotes}</p>
                    {o.performedBy && (
                      <p className="mt-1 text-xs text-slate-500">
                        Entered by {o.performedBy} on {o.resultDate}
                      </p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {resultOrder && (
        <ResultModal
          order={resultOrder}
          onClose={() => setResultOrder(null)}
          onSaved={() => setReloadCount(reloadCount + 1)}
        />
      )}
    </PortalPage>
  );
}

function ResultModal({ order, onClose, onSaved }: { order: LabOrder; onClose: () => void; onSaved: () => void }) {
  const [resultNotes, setResultNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // save the result
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!window.confirm("Save this result? It can't be changed after it's saved.")) return;
    setError("");
    setSaving(true);
    try {
      await api.patch(`/api/lab/orders/${order.labOrderId}/result`, { resultNotes });
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Enter Result" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">{order.testName}</p>
          <p>
            {order.patientName} · born {order.dob}
          </p>
          <p>
            Ordered {order.orderDate} by Dr. {order.orderedBy}
          </p>
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Result
          <textarea
            required
            rows={5}
            value={resultNotes}
            onChange={(e) => setResultNotes(e.target.value)}
            placeholder="e.g. Total cholesterol 210 mg/dL (slightly high), LDL 135 mg/dL"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <ErrorText message={error} />
        <FormActions saving={saving} onCancel={onClose} saveLabel="Save Result" />
      </form>
    </Modal>
  );
}
