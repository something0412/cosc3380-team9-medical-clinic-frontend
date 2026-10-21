import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../../../context/AuthContext";
import { authErrorMessage } from "../../../services/authApi";
import { getOfficeSupplies, getSupplyOrders, recordSupplyUse, requestRestock } from "../../../services/nursingApi";
import type { OfficeSupply, SupplyOrder } from "../../../types";

// Supplies (nurses): the office's stock with low-stock and expiring-soon
// warnings. Nurses take items out as they use them and request restocks.
export function Supplies() {
  const { user } = useAuth();
  const [supplies, setSupplies] = useState<OfficeSupply[]>([]);
  const [orders, setOrders] = useState<SupplyOrder[]>([]);
  // How many to use, per supply row, while typing.
  const [useCounts, setUseCounts] = useState<Record<number, string>>({});
  const [restockSupplyId, setRestockSupplyId] = useState("");
  const [restockQuantity, setRestockQuantity] = useState("");
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const reload = () => setReloadCount((n) => n + 1);

  useEffect(() => {
    if (!user?.officeId) return;
    let ignore = false;
    Promise.all([getOfficeSupplies(user.officeId), getSupplyOrders(user.officeId)])
      .then(([stock, recent]) => {
        if (!ignore) {
          setSupplies(stock);
          setOrders(recent);
        }
      })
      .catch(() => {
        if (!ignore) setError("Could not load supplies.");
      });
    return () => {
      ignore = true;
    };
  }, [user?.officeId, reloadCount]);

  async function handleUse(officeSupplyId: number) {
    if (!user) return;
    try {
      await recordSupplyUse(user.id, officeSupplyId, Number(useCounts[officeSupplyId] || 1));
      setUseCounts({ ...useCounts, [officeSupplyId]: "" });
      reload();
    } catch (err) {
      alert(`Could not update stock: ${authErrorMessage(err)}`);
    }
  }

  async function handleRestock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    try {
      await requestRestock(user.id, Number(restockSupplyId), Number(restockQuantity));
      setRestockSupplyId("");
      setRestockQuantity("");
      reload();
    } catch (err) {
      alert(`Could not request restock: ${authErrorMessage(err)}`);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Supplies</h1>
        <p className="mt-1 text-sm text-gray-500">Your office's stock. Record what you use and request restocks.</p>
        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      </div>

      <div className="overflow-x-auto rounded border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">Supply</th>
              <th className="p-2">Type</th>
              <th className="p-2">On hand</th>
              <th className="p-2">Reorder at</th>
              <th className="p-2">Expires</th>
              <th className="p-2">Use</th>
            </tr>
          </thead>
          <tbody>
            {supplies.map((s) => (
              <tr key={s.officeSupplyId} className="border-b">
                <td className="p-2">
                  {s.name}
                  {s.lowStock && <span className="ml-2 rounded bg-amber-100 px-1.5 text-xs text-amber-800">Low</span>}
                  {s.expiringSoon && <span className="ml-2 rounded bg-red-100 px-1.5 text-xs text-red-800">Expiring</span>}
                </td>
                <td className="p-2">{s.type}</td>
                <td className="p-2">{s.quantityOnHand}</td>
                <td className="p-2">{s.reorderThreshold}</td>
                <td className="p-2">{s.expirationDate ?? "—"}</td>
                <td className="p-2">
                  <span className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={useCounts[s.officeSupplyId] ?? ""}
                      onChange={(e) => setUseCounts({ ...useCounts, [s.officeSupplyId]: e.target.value })}
                      className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleUse(s.officeSupplyId)}
                      className="text-blue-700 hover:underline"
                    >
                      Use
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {supplies.length === 0 && <p className="p-3 text-sm text-gray-500">No supplies stocked at your office.</p>}
      </div>

      <form onSubmit={handleRestock} className="flex flex-wrap items-end gap-2 rounded border border-gray-200 bg-gray-50 p-3">
        <label className="text-sm">
          Request restock
          <select
            required
            value={restockSupplyId}
            onChange={(e) => setRestockSupplyId(e.target.value)}
            className="mt-1 block rounded border border-gray-300 bg-white px-2 py-1 text-sm"
          >
            <option value="">Select a supply…</option>
            {supplies.map((s) => (
              <option key={s.officeSupplyId} value={s.supplyId}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Quantity
          <input
            required
            type="number"
            min="1"
            value={restockQuantity}
            onChange={(e) => setRestockQuantity(e.target.value)}
            className="mt-1 block w-24 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
          />
        </label>
        <button type="submit" className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800">
          Request
        </button>
      </form>

      <section>
        <h2 className="mb-2 font-semibold text-gray-900">Recent restock requests</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-gray-500">None yet.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {orders.map((o) => (
              <li key={o.supplyOrderId}>
                {o.orderDate} · {o.supplyName} × {o.quantityOrdered} · {o.status}
                <span className="text-gray-500"> · {o.requestedBy}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
