import { useEffect, useState } from "react";
import { api } from "../../api";

interface Appointment {
    appointmentId: number;
    appointmentDate: string;
    appointmentTime: string;
    doctorName: string;
    specialty: string | null;
    status: string;
}

export function PatientAppointments() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadAppointments() {
            try {
                const response = await api.get<Appointment[]>("/api/patient/appointments");
                if (active) setAppointments(response.data);
            } catch {
                if (active) setError("Appointments could not be loaded.");
            } finally {
                if (active) setLoading(false);
            }
        }

        loadAppointments();
        return () => { active = false; };
    }, []);

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
                                        <td className="p-3">{appointment.appointmentDate.slice(0, 10)}</td>
                                        <td className="p-3">{appointment.appointmentTime}</td>
                                        <td className="p-3">{appointment.doctorName}</td>
                                        <td className="p-3">{appointment.specialty || "N/A"}</td>
                                        <td className="p-3">{appointment.status}</td>
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