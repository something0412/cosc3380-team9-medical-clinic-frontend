import { useEffect, useState } from "react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";

interface VisitRecord {
    appointmentId: number;
    visitDate: string;
    diagnosis: string | null;
    notes: string | null;
}

interface PrescriptionRecord {
    prescriptionItemId: number;
    medicationName: string;
    dosage: string;
    instructions: string | null;
    isActive: boolean;
}

interface LabRecord {
    labOrderId: number;
    testName: string;
    orderDate: string;
    resultNotes: string | null;
}

interface MedicalRecords {
    visits: VisitRecord[];
    prescriptions: PrescriptionRecord[];
    labResults: LabRecord[];
}

export function PatientRecords() {
    const { user } = useAuth();
    const patientId = user?.role === "patient" ? user.id : null;

    const [records, setRecords] = useState<MedicalRecords | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadRecords() {
            setLoading(true);
            setError("");
            setRecords(null);

            if (patientId === null || !Number.isSafeInteger(patientId) || patientId <= 0) {
                if (active) {
                    setError("Patient information was not found. Please log in again.");
                    setLoading(false);
                }
                return;
            }

            try {
                const response = await api.get<MedicalRecords>(
                    `/api/patient/${patientId}/records`
                );

                if (active) {
                    setRecords(response.data);
                    setError("");
                }
            } catch (err) {
                console.error("Could not load patient medical records:", err);

                if (active) {
                    setError("Medical records could not be loaded.");
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        loadRecords();

        return () => { active = false; };
    }, [patientId]);

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-bold">My Medical Records</h2>
                <p className="text-gray-600 mt-1">
                    View your visit history, prescriptions, and lab results.
                </p>
            </div>

            {loading && <p>Loading medical records...</p>}
            {error && <p className="text-red-600">{error}</p>}

            {!loading && !error && records && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border rounded-lg p-5">
                            <h3 className="font-semibold">Visits</h3>
                            <p className="text-2xl font-bold mt-2">
                                {records.visits.length}
                            </p>
                        </div>

                        <div className="border rounded-lg p-5">
                            <h3 className="font-semibold">Prescriptions</h3>
                            <p className="text-2xl font-bold mt-2">
                                {records.prescriptions.length}
                            </p>
                        </div>

                        <div className="border rounded-lg p-5">
                            <h3 className="font-semibold">Lab Results</h3>
                            <p className="text-2xl font-bold mt-2">
                                {records.labResults.length}
                            </p>
                        </div>
                    </div>

                    <section className="border rounded-lg p-5">
                        <h3 className="text-lg font-semibold mb-4">Visit History</h3>

                        {records.visits.length === 0 ? (
                            <p className="text-gray-500">No visit records found.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Diagnosis</th>
                                            <th className="p-3">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {records.visits.map((visit) => (
                                            <tr key={visit.appointmentId} className="border-b">
                                                <td className="p-3">
                                                    {visit.visitDate?.slice(0, 10) || "N/A"}
                                                </td>
                                                <td className="p-3">
                                                    {visit.diagnosis || "Not provided"}
                                                </td>
                                                <td className="p-3">
                                                    {visit.notes || "No notes"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className="border rounded-lg p-5">
                        <h3 className="text-lg font-semibold mb-4">My Prescriptions</h3>

                        {records.prescriptions.length === 0 ? (
                            <p className="text-gray-500">No prescriptions found.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="p-3">Medication</th>
                                            <th className="p-3">Dosage</th>
                                            <th className="p-3">Instructions</th>
                                            <th className="p-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {records.prescriptions.map((prescription) => (
                                            <tr key={prescription.prescriptionItemId} className="border-b">
                                                <td className="p-3">
                                                    {prescription.medicationName}
                                                </td>
                                                <td className="p-3">
                                                    {prescription.dosage}
                                                </td>
                                                <td className="p-3">
                                                    {prescription.instructions || "—"}
                                                </td>
                                                <td className="p-3">
                                                    {prescription.isActive ? "Active" : "Inactive"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className="border rounded-lg p-5">
                        <h3 className="text-lg font-semibold mb-4">Lab Results</h3>

                        {records.labResults.length === 0 ? (
                            <p className="text-gray-500">No lab results found.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="p-3">Test</th>
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Result</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {records.labResults.map((lab) => (
                                            <tr key={lab.labOrderId} className="border-b">
                                                <td className="p-3">
                                                    {lab.testName}
                                                </td>
                                                <td className="p-3">
                                                    {lab.orderDate?.slice(0, 10) || "N/A"}
                                                </td>
                                                <td className="p-3">
                                                    {lab.resultNotes || "Pending"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}