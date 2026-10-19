import { useEffect, useState } from "react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";

interface Appointment {
    appointmentId: number;
    appointmentDate: string;
    appointmentTime: string | null;
    doctorName: string;
    specialty: string | null;
    status: string;
}

export function PatientAppointments() {
    const { user } = useAuth();
    const patientId = user?.role === "patient" ? user.id : null;

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadAppointments() {
            setLoading(true);
            setError("");

            if (patientId === null || !Number.isSafeInteger(patientId) || patientId <= 0) {
                setError("Patient information was not found. Please log in again.");
                setLoading(false);
                return;
            }

            try {
                const response = await api.get<Appointment[]>(
                    `/api/patient/${patientId}/appointments`
                );

                if (active) {
                    setAppointments(response.data);
                    setError("");
                }
            } catch (err) {
                console.error("Could not load patient appointments:", err);

                if (active) {
                    setError("Appointments could not be loaded.");
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        loadAppointments();

        return () => { active = false; };
    }, [patientId]);

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-bold">My Appointments</h2>
                <p className="text-gray-600 mt-1">
                    View your appointments and check their status.
                </p>
            </div>

            <div className="border rounded-lg p-5">
                <h3 className="text-lg font-semibold mb-4">Appointment History</h3>

                {loading && <p>Loading appointments...</p>}
                {error && <p className="text-red-600">{error}</p>}

                {!loading && !error && appointments.length === 0 && (
                    <p className="text-gray-500">No appointments found.</p>
                )}

                {!loading && !error && appointments.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Time</th>
                                    <th className="p-3">Doctor</th>
                                    <th className="p-3">Specialty</th>
                                    <th className="p-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map((appointment) => (
                                    <tr key={appointment.appointmentId} className="border-b">
                                        <td className="p-3">
                                            {appointment.appointmentDate?.slice(0, 10) || "N/A"}
                                        </td>
                                        <td className="p-3">
                                            {appointment.appointmentTime || "N/A"}
                                        </td>
                                        <td className="p-3">
                                            {appointment.doctorName}
                                        </td>
                                        <td className="p-3">
                                            {appointment.specialty || "N/A"}
                                        </td>
                                        <td className="p-3">
                                            {appointment.status}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="border rounded-lg p-5">
                <h3 className="text-lg font-semibold">Book an Appointment</h3>
                <p className="text-gray-600 mt-2">
                    Online booking will be available once the clinic's doctors and time slots are connected.
                </p>
            </div>
        </div>
    );
}