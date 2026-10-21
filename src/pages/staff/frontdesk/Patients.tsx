import { useEffect, useState } from "react";
import { getPatients } from "../../../services/nursingApi";
import type { Patient } from "../../../types";
import { PatientProfilePanel } from "./PatientProfilePanel";
import { RegisterPatientForm } from "./RegisterPatientForm";

// Patients (receptionists): find a patient by name or register a new
// one, then manage their details and intake on the right.
export function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  // Bumping this reloads the list, e.g. after registering someone.
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    getPatients()
      .then(setPatients)
      .catch(() => setError("Could not load patients."));
  }, [reloadCount]);

  const filtered = patients.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()),
  );

  function showPatient(patientId: number) {
    setSelectedId(patientId);
    setRegistering(false);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Patients</h1>
          <p className="mt-1 text-sm text-gray-500">Register patients and manage their intake.</p>
        </div>
        <button
          type="button"
          onClick={() => setRegistering(true)}
          className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          Register new patient
        </button>
      </div>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

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
                  onClick={() => showPatient(p.patientId)}
                  className={`w-full rounded px-3 py-2 text-left text-sm ${
                    p.patientId === selectedId && !registering ? "bg-blue-50 font-medium" : "hover:bg-gray-50"
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
          {registering ? (
            <RegisterPatientForm
              onRegistered={(patient) => {
                setReloadCount((n) => n + 1);
                showPatient(patient.patientId);
              }}
            />
          ) : selectedId ? (
            // key: a fresh panel per patient, so one patient's half-filled
            // forms never show under another's name.
            <PatientProfilePanel key={selectedId} patientId={selectedId} />
          ) : (
            <p className="text-sm text-gray-500">Select a patient, or register a new one.</p>
          )}
        </div>
      </div>
    </div>
  );
}
