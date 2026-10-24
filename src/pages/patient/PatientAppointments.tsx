import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
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

interface Doctor {
    doctorId: number;
    firstName: string;
    lastName: string;
    specialties: { specialtyId: number; name: string }[];
}

interface TimeSlot {
    timeSlotId: number;
    startTime: string;
    officeName: string;
    specialtyId: number;
    requiresReferral: boolean;
    referralId: number | null;
}

function today() {
    const d = new Date();

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function showTime(value: string | null) {
    if (!value) return "N/A";

    const [hour, minute = "00"] = value.split(":");
    const h = Number(hour);

    if (!Number.isInteger(h) || h < 0 || h > 23) return value;

    return `${h % 12 || 12}:${minute} ${h >= 12 ? "PM" : "AM"}`;
}


export function PatientAppointments() {
    const { user } = useAuth();
    const patientId = user?.role === "patient" ? user.id : null;

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loadingDoctors, setLoadingDoctors] = useState(true);
    const [times, setTimes] = useState<TimeSlot[]>([]);

    const [doctorId, setDoctorId] = useState("");
    const [date, setDate] = useState("");
    const [timeSlotId, setTimeSlotId] = useState("");

    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [saving, setSaving] = useState(false);

    const [historyError, setHistoryError] = useState("");
    const [bookingError, setBookingError] = useState("");
    const [message, setMessage] = useState("");
    const [refresh, setRefresh] = useState(0);


    //load this patients appointment history
    useEffect(() => {
        let active = true;

        if (!patientId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setHistoryError("");

        api.get<Appointment[]>(`/api/patient/${patientId}/appointments`)
            .then(response => {
                if (active) setAppointments(response.data);
            })
            .catch(() => {
                if (active) setHistoryError("Could not load your appointments");
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => { active = false; };

    }, [patientId, refresh]);


    //get the doctors when the page opens
    useEffect(() => {
        async function loadDoctors() {
            if (!patientId) return;
            try {
                const response = await api.get<Doctor[]>("/api/public/doctors");
                setDoctors(response.data);
            } catch {
                setBookingError("Could not load doctors");
            } finally {
                setLoadingDoctors(false);
            }
        }

        loadDoctors();
    }, [patientId]);


    //check the open times when the doctor or date changes
    useEffect(() => {
        let active = true;

        async function loadTimes() {
            setChecking(true);
            try {
                const response = await api.get<TimeSlot[]>("/api/availability", {
                    params: { doctorId, date }
                });
                if (active) setTimes(response.data);
            } catch {
                if (active) setBookingError("Could not check available times");
            } finally {
                if (active) setChecking(false);
            }
        }

        if (!patientId || !doctorId || !date) return;
        loadTimes();

        return () => { active = false; };

    }, [patientId, doctorId, date, refresh]);

    // specialists need an approved referral before any time can be booked
    const needsReferral = times.length > 0 && times.every(t => t.requiresReferral && !t.referralId);
    const openTimes = needsReferral ? [] : times;
    const selectedDoctor = doctors.find(d => String(d.doctorId) === doctorId);
    const selectedSlot = times.find(t => String(t.timeSlotId) === timeSlotId);


    //book the selected time and refresh the history
    async function bookAppointment(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const slot = selectedSlot;
        if (!patientId || !doctorId || !date || !slot) return;

        setSaving(true);
        setBookingError("");
        setMessage("");

        try {
            await api.post("/api/appointments", {
                doctorId: Number(doctorId),
                specialtyId: slot.specialtyId,
                date,
                timeSlotId: slot.timeSlotId,
                referralId: slot.referralId
            });

            setMessage("Your appointment was booked!");
            setTimeSlotId("");

            setRefresh(n => n + 1);

        } catch (err) {
            const detail = axios.isAxiosError(err)
                ? err.response?.data?.error
                : null;

            setBookingError(
                typeof detail === "string"
                    ? detail
                    : "Booking failed. Please try again."
            );

            setRefresh(n => n + 1);

        } finally {
            setSaving(false);
        }
    }


    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">

            <div className="rounded-xl bg-gradient-to-r from-blue-700 to-teal-500 p-6 text-white">
                <p className="text-sm text-blue-100">PATIENT PORTAL</p>

                <h2 className="text-2xl font-bold mt-2">
                    My Appointments
                </h2>

                <p className="mt-1">
                    Hi {user?.firstName || "there"}, schedule your next visit here.
                </p>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                <form
                    onSubmit={bookAppointment}
                    className="lg:col-span-2 bg-white border rounded-xl p-6 space-y-5"
                >
                    <h3 className="text-xl font-semibold text-slate-800">
                        Book an Appointment
                    </h3>

                    <label className="block text-sm font-medium text-slate-700">
                        Doctor

                        <select
                            className="mt-2 w-full rounded-lg border p-3"
                            value={doctorId}
                            required
                            onChange={e => {
                                setDoctorId(e.target.value);
                                setTimes([]);
                                setTimeSlotId("");
                                setMessage("");
                                setBookingError("");
                            }}
                        >
                            <option value="">Choose a doctor</option>

                            {doctors.map(d => (
                                <option key={d.doctorId} value={d.doctorId}>
                                    Dr. {d.firstName} {d.lastName}
                                    {d.specialties.length > 0 && ` (${d.specialties.map(s => s.name).join(", ")})`}
                                </option>
                            ))}
                        </select>
                    </label>

                    {loadingDoctors && (
                        <p className="text-sm text-slate-500">
                            Loading doctors...
                        </p>
                    )}

                    {!loadingDoctors && doctors.length === 0 && !bookingError && (
                        <p className="text-sm text-slate-500">
                            No doctors with a schedule yet.
                        </p>
                    )}


                    <label className="block text-sm font-medium text-slate-700">
                        Appointment Date

                        <input
                            type="date"
                            required
                            min={today()}
                            value={date}
                            onChange={e => {
                                setDate(e.target.value);
                                setTimes([]);
                                setTimeSlotId("");
                                setMessage("");
                                setBookingError("");
                            }}
                            className="mt-2 w-full rounded-lg border p-3"
                        />
                    </label>


                    <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">
                            Available Times
                        </p>

                        {checking && (
                            <p className="text-sm text-blue-600">
                                Checking times...
                            </p>
                        )}

                        {!checking && doctorId && date && times.length === 0 && (
                            <p className="text-sm text-slate-500">
                                No open times found for this date.
                            </p>
                        )}

                        {!checking && needsReferral && (
                            <p className="text-sm text-amber-700">
                                This specialist needs an approved referral from your doctor before you can book.
                            </p>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {openTimes.map(t => (
                                <button
                                    key={t.timeSlotId}
                                    type="button"
                                    onClick={() => setTimeSlotId(String(t.timeSlotId))}
                                    className={`rounded-lg border p-3 text-sm ${
                                        String(t.timeSlotId) === timeSlotId
                                            ? "bg-blue-600 text-white"
                                            : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                    }`}
                                >
                                    {showTime(t.startTime)}
                                </button>
                            ))}
                        </div>
                    </div>


                    {bookingError && (
                        <p className="text-red-600 text-sm">
                            {bookingError}
                        </p>
                    )}

                    {message && (
                        <p className="text-green-700 text-sm">
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={!timeSlotId || saving || checking}
                        className="rounded-lg bg-blue-600 px-5 py-3 text-white font-medium disabled:opacity-50"
                    >
                        {saving ? "Booking..." : "Confirm Appointment"}
                    </button>
                </form>


                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 h-fit">
                    <h3 className="font-semibold text-lg text-slate-800">
                        Your Selection
                    </h3>

                    <p className="mt-4 text-sm text-slate-600">Doctor</p>
                    <p className="font-medium">
                        {selectedDoctor ? `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}` : "Not selected"}
                    </p>

                    <p className="mt-4 text-sm text-slate-600">Date</p>
                    <p className="font-medium">
                        {date || "Not selected"}
                    </p>

                    <p className="mt-4 text-sm text-slate-600">Time</p>
                    <p className="font-medium">
                        {showTime(selectedSlot?.startTime ?? null)}
                    </p>

                    <p className="mt-4 text-sm text-slate-600">Office</p>
                    <p className="font-medium">
                        {selectedSlot?.officeName || "Not selected"}
                    </p>
                </div>
            </div>


            <div className="bg-white border rounded-xl p-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">
                    Appointment History
                </h3>

                {loading && <p>Loading appointments...</p>}

                {historyError && (
                    <p className="text-red-600 text-sm">
                        {historyError}
                    </p>
                )}

                {!loading && !historyError && appointments.length === 0 && (
                    <p>No appointments found.</p>
                )}

                {!loading && !historyError && appointments.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Time</th>
                                    <th className="p-3">Doctor</th>
                                    <th className="p-3">Specialty</th>
                                    <th className="p-3">Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {appointments.map(a => (
                                    <tr key={a.appointmentId} className="border-b">
                                        <td className="p-3">
                                            {a.appointmentDate?.slice(0, 10)}
                                        </td>

                                        <td className="p-3">
                                            {showTime(a.appointmentTime)}
                                        </td>

                                        <td className="p-3">{a.doctorName}</td>
                                        <td className="p-3">{a.specialty || "N/A"}</td>
                                        <td className="p-3">{a.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}