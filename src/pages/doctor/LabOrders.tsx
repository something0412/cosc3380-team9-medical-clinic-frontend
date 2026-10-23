import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { ErrorText, SelectField } from "../../components/FormControls";
import { Modal } from "../../components/Modal";
import { FormActions, PrimaryButton, StatusBadge, TextButton } from "../../components/ProfileUI";

interface LabOrder {
  labOrderId: number;
  patientId: number;
  patientName: string;
  testName: string;
  status: string;
  orderDate: string;
  resultNotes: string | null;
}

interface PatientOption {
  patientId: number;
  firstName: string;
  lastName: string;
}

interface LabTest {
  labTestTypeId: number;
  name: string;
  cost: number;
}

export function DoctorLabOrders() {
  const [status, setStatus] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const [showForm, setShowForm] = useState(false);

  // load my lab orders
  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await api.get<LabOrder[]>("/api/doctor/lab-orders", { params: { status, search } });
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

  // cancel an order
  async function cancelOrder(order: LabOrder) {
    if (!window.confirm(`Cancel the ${order.testName} order for ${order.patientName}?`)) return;
    try {
      await api.patch(`/api/doctor/lab-orders/${order.labOrderId}/cancel`);
      setReloadCount(reloadCount + 1);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  const waiting = orders.filter((o) => o.status === "Ordered" || o.status === "InProgress").length;
  const completed = orders.filter((o) => o.status === "Completed").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Orders</h1>
          <p className="mt-1 text-gray-600">Lab tests you ordered and their results.</p>
        </div>
        <PrimaryButton type="button" onClick={() => setShowForm(true)}>
          Create Order
        </PrimaryButton>
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

      <div className="flex flex-wrap items-end gap-6">
        <div className="w-48">
          <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="Ordered">Ordered</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </SelectField>
        </div>
        <p className="pb-2 text-sm text-gray-600">
          {completed} with results · {waiting} waiting
        </p>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="rounded-lg border border-gray-200 bg-white">
        {loading ? (
          <p className="p-4 text-gray-500">Loading lab orders...</p>
        ) : orders.length === 0 ? (
          <p className="p-4 text-gray-500">{search ? `No lab orders for "${search}".` : "No lab orders."}</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {orders.map((o) => (
              <li key={o.labOrderId} className="p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900">{o.testName}</span>
                    <StatusBadge status={o.status} />
                    <Link to={`/doctor/patients/${o.patientId}`} className="text-blue-600 hover:underline">
                      {o.patientName}
                    </Link>
                    <span className="text-gray-500">ordered {o.orderDate}</span>
                  </div>
                  {(o.status === "Ordered" || o.status === "InProgress") && (
                    <TextButton danger onClick={() => cancelOrder(o)}>Cancel</TextButton>
                  )}
                </div>
                {o.resultNotes && <p className="mt-2 text-gray-700">{o.resultNotes}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {showForm && (
        <CreateOrderModal
          onClose={() => setShowForm(false)}
          onSaved={() => setReloadCount(reloadCount + 1)}
        />
      )}
    </div>
  );
}

function CreateOrderModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [patientId, setPatientId] = useState("");
  const [labTestTypeId, setLabTestTypeId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // load patients and lab tests for the dropdowns
  useEffect(() => {
    async function loadOptions() {
      try {
        const patientsRes = await api.get<PatientOption[]>("/api/doctor/patients");
        setPatients(patientsRes.data);
        const testsRes = await api.get<LabTest[]>("/api/doctor/lab-tests");
        setTests(testsRes.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      }
    }
    loadOptions();
  }, []);

  // create the order
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/api/doctor/lab-orders", { patientId: Number(patientId), labTestTypeId: Number(labTestTypeId) });
      onSaved();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Create Lab Order" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <SelectField label="Patient" required value={patientId} onChange={(e) => setPatientId(e.target.value)}>
          <option value="">Select a patient</option>
          {patients.map((p) => (
            <option key={p.patientId} value={p.patientId}>{p.lastName}, {p.firstName}</option>
          ))}
        </SelectField>
        <SelectField label="Lab Test" required value={labTestTypeId} onChange={(e) => setLabTestTypeId(e.target.value)}>
          <option value="">Select a test</option>
          {tests.map((t) => (
            <option key={t.labTestTypeId} value={t.labTestTypeId}>{t.name} (${t.cost.toFixed(2)})</option>
          ))}
        </SelectField>
        <ErrorText message={error} />
        <FormActions saving={saving} onCancel={onClose} saveLabel="Create Order" />
      </form>
    </Modal>
  );
}
