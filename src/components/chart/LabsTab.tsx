import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiErrorMessage } from "../../api";
import { getLabOrders, getLabTestTypes, orderLab, updateLabOrder } from "../../services/nursingApi";
import type { LabOrder, LabTestType } from "../../types";

const STATUS_LABEL: Record<LabOrder["status"], string> = {
  Ordered: "Ordered",
  InProgress: "In progress",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

// The patient's lab orders. Nurses order tests (for today's visit, which
// adds the test's cost to that visit's bill) and move each one along:
// Ordered -> In progress -> Completed with results, or Cancelled.
export function LabsTab({
  patientId,
  appointmentId,
  canEdit,
}: {
  patientId: number;
  appointmentId: number | null;
  canEdit: boolean;
}) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [testTypes, setTestTypes] = useState<LabTestType[]>([]);
  const [labTestTypeId, setLabTestTypeId] = useState("");
  // The order whose results are being typed in, and the text so far.
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [results, setResults] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const reload = () => setReloadCount((n) => n + 1);

  useEffect(() => {
    let ignore = false;
    getLabOrders(patientId)
      .then((data) => {
        if (!ignore) setOrders(data);
      })
      .catch(() => {
        if (!ignore) setOrders([]);
      });
    return () => {
      ignore = true;
    };
  }, [patientId, reloadCount]);

  useEffect(() => {
    if (!canEdit) return;
    getLabTestTypes()
      .then(setTestTypes)
      .catch(() => setTestTypes([]));
  }, [canEdit]);

  async function run(action: () => Promise<void>, failure: string) {
    try {
      await action();
      setCompletingId(null);
      setResults("");
      reload();
    } catch (err) {
      alert(`${failure}: ${apiErrorMessage(err)}`);
    }
  }

  function handleOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    run(async () => {
      await orderLab(user.id, { patientId, labTestTypeId: Number(labTestTypeId), appointmentId });
      setLabTestTypeId("");
    }, "Could not order test");
  }

  return (
    <div className="space-y-3">
      {canEdit && (
        <form onSubmit={handleOrder} className="flex flex-wrap items-end gap-2 rounded border border-gray-200 bg-gray-50 p-3">
          <label className="text-xs text-gray-700">
            Order a test{appointmentId ? " for today's visit" : ""}
            <select
              required
              value={labTestTypeId}
              onChange={(e) => setLabTestTypeId(e.target.value)}
              className="mt-1 block rounded border border-gray-300 bg-white px-2 py-1 text-sm"
            >
              <option value="">Select a test…</option>
              {testTypes.map((t) => (
                <option key={t.labTestTypeId} value={t.labTestTypeId}>
                  {t.name} (${Number(t.cost).toFixed(2)})
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800">
            Order
          </button>
        </form>
      )}

      {orders.length === 0 ? (
        <p className="text-sm text-gray-500">No lab orders.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {orders.map((o) => (
            <li key={o.labOrderId} className="space-y-1 rounded border border-gray-200 p-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {o.testName} · <span className="font-medium">{STATUS_LABEL[o.status]}</span>
                  <span className="text-gray-500">
                    {" "}· ordered {o.orderDate} by {o.orderedBy}
                  </span>
                </span>
                {canEdit && user && (
                  <span className="flex gap-3">
                    {o.status === "Ordered" && (
                      <button
                        type="button"
                        onClick={() =>
                          run(() => updateLabOrder(user.id, o.labOrderId, { status: "InProgress", resultNotes: "" }), "Could not update")
                        }
                        className="text-blue-700 hover:underline"
                      >
                        Start
                      </button>
                    )}
                    {o.status === "InProgress" && (
                      <button type="button" onClick={() => setCompletingId(o.labOrderId)} className="text-blue-700 hover:underline">
                        Enter results
                      </button>
                    )}
                    {(o.status === "Ordered" || o.status === "InProgress") && (
                      <button
                        type="button"
                        onClick={() =>
                          run(() => updateLabOrder(user.id, o.labOrderId, { status: "Cancelled", resultNotes: "" }), "Could not cancel")
                        }
                        className="text-blue-700 hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                  </span>
                )}
              </div>
              {o.resultNotes && <p className="text-gray-700">Results: {o.resultNotes}</p>}

              {completingId === o.labOrderId && user && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(
                      () => updateLabOrder(user.id, o.labOrderId, { status: "Completed", resultNotes: results }),
                      "Could not save results",
                    );
                  }}
                  className="flex flex-wrap gap-2"
                >
                  <input
                    required
                    value={results}
                    onChange={(e) => setResults(e.target.value)}
                    placeholder="Results"
                    className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                  <button type="submit" className="rounded bg-blue-700 px-3 py-1 text-sm font-medium text-white hover:bg-blue-800">
                    Complete
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
