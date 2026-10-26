import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api, apiErrorMessage } from "../../api";
import { ErrorText, Field, SelectField } from "../../components/FormControls";
import { Modal } from "../../components/Modal";
import { PageError, PortalPage } from "../../components/PortalPage";
import { FormActions, PrimaryButton, SecondaryButton, Section, StatusBadge, TextButton } from "../../components/ProfileUI";

interface OfficeSupply {
  officeSupplyId: number;
  supplyId: number;
  name: string;
  supplyType: string;
  quantityOnHand: number;
  reorderThreshold: number;
  expirationDate: string | null;
  lowStock: boolean;
  expiringSoon: boolean;
  onOrder: number;
}

interface SupplyOrder {
  supplyOrderId: number;
  supplyName: string;
  quantityOrdered: number;
  orderDate: string;
  status: string;
  orderedBy: string;
}

export function NurseSupplies() {
  const [supplies, setSupplies] = useState<OfficeSupply[]>([]);
  const [orders, setOrders] = useState<SupplyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const [useSupply, setUseSupply] = useState<OfficeSupply | null>(null);
  const [orderSupplyId, setOrderSupplyId] = useState<number | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);

  // load stock and orders
  useEffect(() => {
    async function loadSupplies() {
      try {
        const stockRes = await api.get<OfficeSupply[]>("/api/nurse/supplies");
        setSupplies(stockRes.data);
        const ordersRes = await api.get<SupplyOrder[]>("/api/nurse/supply-orders");
        setOrders(ordersRes.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadSupplies();
  }, [reloadCount]);

  // receive an order
  async function receiveOrder(order: SupplyOrder) {
    if (!window.confirm(`Mark ${order.quantityOrdered} × ${order.supplyName} as received and add it to stock?`)) return;
    setError("");
    try {
      await api.patch(`/api/nurse/supply-orders/${order.supplyOrderId}/receive`);
      setReloadCount(reloadCount + 1);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  // cancel an order
  async function cancelOrder(order: SupplyOrder) {
    if (!window.confirm(`Cancel the order for ${order.quantityOrdered} × ${order.supplyName}?`)) return;
    setError("");
    try {
      await api.patch(`/api/nurse/supply-orders/${order.supplyOrderId}/cancel`);
      setReloadCount(reloadCount + 1);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  // open the order form, with a supply already picked or not
  function openOrderForm(supplyId: number | null) {
    setOrderSupplyId(supplyId);
    setShowOrderForm(true);
  }

  return (
    <PortalPage
      eyebrow="Nursing"
      title="Supplies"
      description="Stock and supply orders for your office."
      actions={<PrimaryButton type="button" onClick={() => openOrderForm(null)}>New Order</PrimaryButton>}
    >
      <PageError message={error} />

      <Section title="Stock">
        {loading ? (
          <p className="text-slate-500">Loading supplies...</p>
        ) : supplies.length === 0 ? (
          <p className="text-slate-500">Your office has no supplies on file.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="p-2 font-medium">Supply</th>
                  <th className="p-2 font-medium">Type</th>
                  <th className="p-2 font-medium">On Hand</th>
                  <th className="p-2 font-medium">Reorder At</th>
                  <th className="p-2 font-medium">On Order</th>
                  <th className="p-2 font-medium">Expires</th>
                  <th className="p-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {supplies.map((s) => (
                  <tr key={s.officeSupplyId} className="border-b last:border-0">
                    <td className="p-2 font-medium text-slate-900">{s.name}</td>
                    <td className="p-2">{s.supplyType}</td>
                    <td className={`p-2 ${s.lowStock ? "bg-red-50 font-bold text-red-800" : ""}`}>
                      {s.quantityOnHand}
                      {s.lowStock && " (low)"}
                    </td>
                    <td className="p-2">{s.reorderThreshold}</td>
                    <td className="p-2">{s.onOrder > 0 ? s.onOrder : "—"}</td>
                    <td className={`p-2 ${s.expiringSoon ? "bg-amber-50 font-medium text-amber-800" : ""}`}>
                      {s.expirationDate ?? "—"}
                      {s.expiringSoon && " (soon)"}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-3">
                        <TextButton onClick={() => setUseSupply(s)} disabled={s.quantityOnHand === 0}>Use</TextButton>
                        <TextButton onClick={() => openOrderForm(s.supplyId)}>Order</TextButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-slate-500">
              <span className="rounded bg-red-100 px-1.5 font-bold text-red-800">Red</span> = at or below reorder level,{" "}
              <span className="rounded bg-orange-50 px-1.5 font-medium text-orange-800">amber</span> = expires within 30 days
            </p>
          </div>
        )}
      </Section>

      <Section title="Supply Orders">
        {loading ? (
          <p className="text-slate-500">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-slate-500">No supply orders yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {orders.map((o) => (
              <li key={o.supplyOrderId} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">{o.quantityOrdered} × {o.supplyName}</span>
                  <StatusBadge status={o.status} />
                  <span className="text-slate-500">{o.orderDate} · by {o.orderedBy}</span>
                </div>
                {(o.status === "Pending" || o.status === "Ordered") && (
                  <div className="flex gap-2">
                    <SecondaryButton onClick={() => receiveOrder(o)}>Receive</SecondaryButton>
                    <TextButton danger onClick={() => cancelOrder(o)}>Cancel</TextButton>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {useSupply && (
        <UseSupplyModal
          supply={useSupply}
          onClose={() => setUseSupply(null)}
          onSaved={() => setReloadCount(reloadCount + 1)}
        />
      )}

      {showOrderForm && (
        <NewOrderModal
          supplyId={orderSupplyId}
          onClose={() => setShowOrderForm(false)}
          onSaved={() => setReloadCount(reloadCount + 1)}
        />
      )}
    </PortalPage>
  );
}

function UseSupplyModal({ supply, onClose, onSaved }: { supply: OfficeSupply; onClose: () => void; onSaved: () => void }) {
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // take supplies out of stock
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.patch(`/api/nurse/supplies/${supply.officeSupplyId}/use`, { quantity: Number(quantity) });
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Use ${supply.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">{supply.quantityOnHand} on hand.</p>
        <Field
          label="Quantity Used"
          type="number"
          min="1"
          max={supply.quantityOnHand}
          required
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <ErrorText message={error} />
        <FormActions saving={saving} onCancel={onClose} saveLabel="Use" />
      </form>
    </Modal>
  );
}

function NewOrderModal({ supplyId, onClose, onSaved }: { supplyId: number | null; onClose: () => void; onSaved: () => void }) {
  const [supplyList, setSupplyList] = useState<{ supplyId: number; name: string; supplyType: string }[]>([]);
  const [selectedId, setSelectedId] = useState(supplyId ? String(supplyId) : "");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // load supply list
  useEffect(() => {
    async function loadSupplyList() {
      try {
        const res = await api.get("/api/nurse/supply-list");
        setSupplyList(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    loadSupplyList();
  }, []);

  // save the order
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/api/nurse/supply-orders", { supplyId: Number(selectedId), quantity: Number(quantity) });
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="New Supply Order" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectField label="Supply" required value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          <option value="">Select a supply</option>
          {supplyList.map((s) => (
            <option key={s.supplyId} value={s.supplyId}>{s.name} ({s.supplyType})</option>
          ))}
        </SelectField>
        <Field label="Quantity" type="number" min="1" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <ErrorText message={error} />
        <FormActions saving={saving} onCancel={onClose} saveLabel="Place Order" />
      </form>
    </Modal>
  );
}
