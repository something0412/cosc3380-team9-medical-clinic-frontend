import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AppointmentList } from "../../../components/AppointmentList";
import { PatientChart } from "../../../components/PatientChart";
import {
  getAnesthesiaRecord,
  getTodaysAppointments,
  saveAnesthesiaRecord,
} from "../../../services/nursingApi";
import type { AnesthesiaRecord, Appointment } from "../../../types";

// Certified Registered Nurse Anesthetist page: only today's procedures
// that need anesthesia. The CRNA fills in the anesthesia record above
// the patient's chart (allergies matter most here).
export function CRNAPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAppointments() {
      try {
        setAppointments(await getTodaysAppointments());
      } catch {
        setError("Could not load today's appointments.");
      }
    }
    loadAppointments();
  }, []);

  const anesthesiaCases = appointments.filter((a) => a.requiresAnesthesia);
  const selected = appointments.find((a) => a.appointmentId === selectedId);

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">CRNA Workspace</h1>
      <p className="mt-1 text-sm text-gray-500">
        Anesthesia records for today's procedures.
      </p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid gap-6 md:grid-cols-[18rem_1fr]">
        <AppointmentList
          appointments={anesthesiaCases}
          selectedId={selectedId}
          onSelect={(a) => setSelectedId(a.appointmentId)}
        />
        <div className="rounded border border-gray-200 bg-white p-4">
          {selected ? (
            <>
              {/* key resets the form when a different patient is picked */}
              <AnesthesiaForm key={selected.appointmentId} appointmentId={selected.appointmentId} />
              <PatientChart patientId={selected.patientId} role="CRNA" appointment={selected} />
            </>
          ) : (
            <p className="text-sm text-gray-500">Select a patient.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Loads this appointment's anesthesia record (or starts a blank one) and
// lets the CRNA edit and save it.
function AnesthesiaForm({ appointmentId }: { appointmentId: number }) {
  const [form, setForm] = useState<AnesthesiaRecord | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadRecord() {
      try {
        const record = await getAnesthesiaRecord(appointmentId);
        setForm(
          record ?? {
            appointmentId,
            consentSigned: false,
            asaClass: "",
            anesthesiaType: "",
            medicationsGiven: "",
            notes: "",
          },
        );
      } catch {
        setMessage("Could not load the anesthesia record.");
      }
    }
    loadRecord();
  }, [appointmentId]);

  if (message && !form) return <p className="mb-6 text-sm text-red-700">{message}</p>;
  if (!form) return <p className="mb-6 text-sm text-gray-500">Loading anesthesia record…</p>;

  // Any edit clears the old "Saved." message.
  function update(changes: Partial<AnesthesiaRecord>) {
    if (form) setForm({ ...form, ...changes });
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    try {
      await saveAnesthesiaRecord(form);
      setMessage("Saved.");
    } catch {
      setMessage("Could not save. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-2 gap-3 rounded border border-purple-200 bg-purple-50 p-4">
      <h3 className="col-span-2 font-semibold text-purple-900">Anesthesia record</h3>

      <label className="text-sm text-gray-700">
        ASA class (patient risk)
        <select
          value={form.asaClass}
          onChange={(e) => update({ asaClass: e.target.value })}
          className="mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1"
        >
          <option value="">Select…</option>
          <option value="I">I — Healthy</option>
          <option value="II">II — Mild disease</option>
          <option value="III">III — Severe disease</option>
          <option value="IV">IV — Life-threatening disease</option>
          <option value="V">V — Not expected to survive without surgery</option>
        </select>
      </label>

      <label className="text-sm text-gray-700">
        Anesthesia type
        <select
          value={form.anesthesiaType}
          onChange={(e) => update({ anesthesiaType: e.target.value })}
          className="mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1"
        >
          <option value="">Select…</option>
          <option value="General">General</option>
          <option value="Regional">Regional</option>
          <option value="Sedation">Sedation</option>
          <option value="Local">Local</option>
        </select>
      </label>

      <label className="col-span-2 text-sm text-gray-700">
        Medications given
        <input
          value={form.medicationsGiven}
          onChange={(e) => update({ medicationsGiven: e.target.value })}
          placeholder="e.g. Propofol 150 mg IV"
          className="mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1"
        />
      </label>

      <label className="col-span-2 text-sm text-gray-700">
        Notes
        <textarea
          value={form.notes}
          onChange={(e) => update({ notes: e.target.value })}
          rows={2}
          className="mt-1 block w-full rounded border border-gray-300 bg-white px-2 py-1"
        />
      </label>

      <label className="col-span-2 flex items-center gap-2 text-sm text-gray-800">
        <input
          type="checkbox"
          checked={form.consentSigned}
          onChange={(e) => update({ consentSigned: e.target.checked })}
        />
        Patient signed anesthesia consent
      </label>

      <div className="col-span-2 flex items-center gap-3">
        <button
          type="submit"
          className="rounded bg-purple-800 px-4 py-2 text-sm font-medium text-white hover:bg-purple-900"
        >
          Save record
        </button>
        {message && <span className="text-sm text-gray-600">{message}</span>}
      </div>
    </form>
  );
}
