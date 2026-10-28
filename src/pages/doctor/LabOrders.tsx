import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { ADMIN_PRIMARY_BUTTON } from "../../components/admin/styles";
import { ErrorText, Field, SelectField } from "../../components/FormControls";
import { Modal } from "../../components/Modal";
import { PageError, PortalPage } from "../../components/PortalPage";
import { FormActions, StatusText, TextButton } from "../../components/ProfileUI";

interface LabOrder {
  labOrderId: number;
  patientId: number;
  patientName: string;
  testName: string;
  status: string;
  orderDate: string;
  resultNotes: string | null;
  resultDate: string | null;
  performedBy: string | null;
}

interface PatientOption {
  patientId: number;
  firstName: string;
  lastName: string;
}

interface LabTest {
  labTestTypeId: number;
  name: string;
  cost: string;
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
      setLoading(true);
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

  // cancel an order the lab hasn't started
  async function cancelOrder(order: LabOrder) {
    if (!window.confirm(`Cancel the ${order.testName} order for ${order.patientName}?`)) return;
    setError("");
    try {
      await api.patch(`/api/doctor/lab-orders/${order.labOrderId}/cancel`);
      setReloadCount(reloadCount + 1);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <PortalPage
      eyebrow="Doctor"
      title="Lab Orders"
      description="Lab tests you ordered and their results."
      actions={
        <button type="button" onClick={() => setShowForm(true)} className={ADMIN_PRIMARY_BUTTON}>
          Create Order
        </button>
      }
    >
      <form onSubmit={handleSearch} className="grid gap-4 rounded-lg shadow-box bg-slate-50 p-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
        <Field label="Patient" type="search" placeholder="Patient name" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="open">Waiting for a result</option>
          <option value="Ordered">Ordered</option>
          <option value="InProgress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </SelectField>
        <button type="submit" className={ADMIN_PRIMARY_BUTTON}>Search</button>
      </form>

      <PageError message={error} />

      <section className="rounded-lg shadow-box bg-white">
        {loading ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">Loading lab orders...</p>
        ) : orders.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">{search ? `No lab orders for "${search}".` : "No lab orders."}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {orders.map((o) => (
              <li key={o.labOrderId} className="p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-navy">{o.testName}</span>
                    <StatusText status={o.status} />
                    <Link to={`/doctor/patients/${o.patientId}`} className="font-medium text-navy hover:text-teal-700 hover:underline">
                      {o.patientName}
                    </Link>
                    <span className="text-slate-500">ordered {o.orderDate}</span>
                  </div>
                  {o.status === "Ordered" && <TextButton danger onClick={() => cancelOrder(o)}>Cancel</TextButton>}
                </div>
                {o.resultNotes && (
                  <div className="mt-2 rounded-lg bg-slate-50 p-3">
                    <p className="text-slate-800">{o.resultNotes}</p>
                    {o.performedBy && <p className="mt-1 text-xs text-slate-500">Entered by {o.performedBy} on {o.resultDate}</p>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {showForm && <CreateOrderModal onClose={() => setShowForm(false)} onSaved={() => setReloadCount(reloadCount + 1)} />}
    </PortalPage>
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
            <option key={t.labTestTypeId} value={t.labTestTypeId}>{t.name} (${Number(t.cost).toFixed(2)})</option>
          ))}
        </SelectField>
        <ErrorText message={error} />
        <FormActions saving={saving} onCancel={onClose} saveLabel="Create Order" />
      </form>
    </Modal>
  );
}
