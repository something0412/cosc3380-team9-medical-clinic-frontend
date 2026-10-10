import { useEffect, useState } from "react";
import { Tabs } from "./components/Tabs";
import { PatientDashboard } from "./Pages/Patient/PatientDashboard";
import type { Patient, TemplateResponse } from "./types";
import "./App.css";
import { api } from "./api";

// --- Patients tab --------------------------------------------------
// This is the pattern to copy for any new entity backed by its own
// database table + Prisma model (appointments, providers, etc.): a piece
// of state for the data, a `loading` flag, an `error` message, a
// useEffect that fetches once on mount, and three render branches
// (loading / error / success).
function PatientsTab() {
    const [patients, setPatients] = useState<Patient[]>([]);

    // Shown while the request is in flight, so the user sees "Loading..."
    // instead of a confusing empty table for a moment.
    const [loading, setLoading] = useState(true);
    // Holds a message if the fetch fails, so the user sees *why* nothing
    // loaded (e.g. backend not running) instead of the tab staying silently
    // empty.
    const [error, setError] = useState<string | null>(null);

    const getPatients = async (): Promise<Patient[]> => {
        const response = await api.get<Patient[]>("/api/patients");
        return response.data;
    };

    useEffect(() => {
        // useEffect's callback itself can't be async (it would return a
        // Promise instead of a cleanup function), so the async work lives
        // in this inner function instead, and we just call it.
        async function loadPatients() {
            try {
                const data = await getPatients();
                setPatients(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load patients");
            } finally {
                setLoading(false);
            }
        }

        loadPatients();
    }, []);

    if (loading) {
        return <p>Loading patients...</p>;
    }

    if (error) {
        return <p className="error">Error: {error}</p>;
    }

    return (
        <table>
            <thead>
                <tr>
                    <th>First name</th>
                    <th>Last name</th>
                    <th>DOB</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Active</th>
                </tr>
            </thead>
            <tbody>
                {patients.map((patient) => (
                    <tr key={patient.patientId}>
                        <td>{patient.firstName}</td>
                        <td>{patient.lastName}</td>
                        <td>{patient.dob}</td>
                        <td>{patient.phone}</td>
                        <td>{patient.email ?? "—"}</td>
                        <td>{patient.isActive ? "Yes" : "No"}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

// --- Appointments tab --------------------------------------------------
// Placeholder: there's no appointments route or Prisma model yet. Once
// those exist, copy PatientsTab above (fetch function in api.ts, an
// Appointment type in types.ts, the loading/error state, the useEffect,
// the render branches) rather than inventing a new pattern.
function AppointmentsTab() {
    return <p>Appointments feature coming soon — no backend route yet.</p>;
}

// --- Template tab --------------------------------------------------
// Demonstrates the simplest possible frontend-to-backend round trip: a
// button click triggers a fetch, and the raw response is displayed. No
// loading/error state here on purpose — this tab is only proving the
// wiring works, not modeling a real feature.
function TemplateTab() {
    const [response, setResponse] = useState<TemplateResponse | null>(null);

    const getTemplate = async (): Promise<TemplateResponse> => {
        const response = await api.get<TemplateResponse>("/api/template");
        return response.data;
    };

    async function handleClick() {
        const data = await getTemplate();
        setResponse(data);
    }

    return (
        <div>
            <button type="button" onClick={handleClick}>
                Call template route
            </button>
            {response && <pre>{JSON.stringify(response, null, 2)}</pre>}
        </div>
    );
}

function App() {
    return (
        <main>
            <h1>Medical Clinic</h1>
            {/* Tabs is a dumb, reusable component — it just renders whatever
          `content` each tab definition is given. All of the actual
          feature logic lives in the tab components above, not in Tabs. */}
            <Tabs
                tabs={[
                    { label: "Patients", content: <PatientsTab /> },
                    { label: "Appointments", content: <AppointmentsTab /> },
                    { label: "Template", content: <TemplateTab /> },
                    {label: "Patient Portal", content: <PatientDashboard />},
                ]}
            />
        </main>
    );
}

export default App;
