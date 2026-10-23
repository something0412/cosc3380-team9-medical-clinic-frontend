import { useEffect, useState } from "react";
import { getPatientChart } from "../services/nursingApi";
import type { Appointment, PatientChart as Chart } from "../types";
import { timeOf } from "../utils/dates";
import { AllergiesTab } from "./chart/AllergiesTab";
import { LabsTab } from "./chart/LabsTab";
import { MedicationsTab } from "./chart/MedicationsTab";
import { NotesTab } from "./chart/NotesTab";
import { VitalsTab } from "./chart/VitalsTab";

const TABS = ["Vitals", "Allergies", "Medications", "Notes", "Labs"] as const;
type Tab = (typeof TABS)[number];

// One patient's chart, used by the nursing pages: a header with any
// severe allergies, then a tab each for vitals, allergies, medications,
// visit notes and lab orders.
//
// `canEdit` lets the nurse record and change things (Clinical Queue);
// without it the chart is read-only (Patient Charts lookup).
//
// `appointment` is today's visit, if any — shown in the header; vitals,
// notes and labs recorded here are attached to it.
export function PatientChart({
  patientId,
  canEdit = false,
  appointment,
}: {
  patientId: number;
  canEdit?: boolean;
  appointment?: Appointment;
}) {
  const [chart, setChart] = useState<Chart | null>(null);
  const [tab, setTab] = useState<Tab>("Vitals");
  const [error, setError] = useState("");
  // Changing this number re-runs the effect below, reloading the chart
  // after the nurse saves something.
  const [reloadCount, setReloadCount] = useState(0);
  const reload = () => setReloadCount((n) => n + 1);

  useEffect(() => {
    // If the nurse clicks another patient before this request finishes,
    // ignore its result so a slow old response can't replace the new one.
    let ignore = false;
    async function loadChart() {
      try {
        setError("");
        const data = await getPatientChart(patientId);
        if (!ignore) setChart(data);
      } catch {
        if (!ignore) setError("Could not load this patient's chart.");
      }
    }
    loadChart();
    return () => {
      ignore = true;
    };
  }, [patientId, reloadCount]);

  if (error) return <p className="text-sm text-red-700">{error}</p>;
  // Also wait if the loaded chart is still the previously selected
  // patient's, so their allergies are never shown under the wrong name.
  if (!chart || chart.patient.patientId !== patientId) {
    return <p className="text-sm text-gray-500">Loading chart…</p>;
  }

  const { patient } = chart;
  const severe = chart.allergies.filter((a) => a.severity === "Severe");
  const appointmentId = appointment?.appointmentId ?? null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {patient.firstName} {patient.lastName}
        </h2>
        <p className="text-sm text-gray-600">
          Patient #{patient.patientId} · DOB {patient.dob}
          {patient.gender && ` · ${patient.gender}`} · {patient.phone}
        </p>
        <p className="text-sm text-gray-600">
          Today:{" "}
          {appointment
            ? `${appointment.specialty} with ${appointment.doctorName}` +
              (appointment.checkedInAt ? ` · checked in at ${timeOf(appointment.checkedInAt)}` : ` · ${appointment.status}`)
            : "No appointment"}
        </p>
      </div>

      {/* Severe allergies go above everything else, on every tab. */}
      {severe.length > 0 && (
        <div className="rounded border border-red-400 bg-red-50 p-3 text-sm font-semibold text-red-900">
          Severe allergies: {severe.map((a) => `${a.allergen}${a.reaction ? ` (${a.reaction})` : ""}`).join(", ")}
        </div>
      )}

      <div className="flex flex-wrap gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm ${
              tab === t ? "border-b-2 border-blue-600 font-medium text-blue-700" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Vitals" && (
        <VitalsTab
          patientId={patientId}
          vitals={chart.vitals}
          appointmentId={appointmentId}
          canEdit={canEdit}
          onSaved={reload}
        />
      )}
      {tab === "Allergies" && (
        <AllergiesTab patientId={patientId} allergies={chart.allergies} canEdit={canEdit} onSaved={reload} />
      )}
      {tab === "Medications" && (
        <MedicationsTab patientId={patientId} medications={chart.medications} canEdit={canEdit} onSaved={reload} />
      )}
      {tab === "Notes" && <NotesTab appointmentId={appointmentId} canEdit={canEdit} />}
      {tab === "Labs" && <LabsTab patientId={patientId} appointmentId={appointmentId} canEdit={canEdit} />}
    </div>
  );
}
