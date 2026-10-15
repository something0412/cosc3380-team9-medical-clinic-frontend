
import { useEffect, useState } from "react";
import { api } from "../../api";

interface PatientForm {
    formTypeId: number;
    name: string;
    isRequired: boolean;
    status: string | null;
    submittedDate: string | null;
}

export function PatientForms() {
    const [forms, setForms] = useState<PatientForm[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadForms() {
            try {
                const response = await api.get<PatientForm[]>("/api/patient/forms");
                if (active) setForms(response.data);
            } catch {
                if (active) setError("Patient forms could not be loaded.");
            } finally {
                if (active) setLoading(false);
            }
        }

        loadForms();
        return () => { active = false; };
    }, []);

    const requiredForms = forms.filter((form) => form.isRequired);
    const completedForms = forms.filter((form) => form.status?.toLowerCase() === "completed");

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Patient Forms</h2>
                <p className="text-gray-600 mt-1">
                    View your required forms and check their submission status.
                </p>
            </div>

            {loading && <p>Loading patient forms...</p>}
            {error && <p className="text-red-600">{error}</p>}

            {!loading && !error && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-5">
                            <h3 className="font-semibold">Required Forms</h3>
                            <p className="text-2xl font-bold mt-2">{requiredForms.length}</p>
                        </div>

                        <div className="border rounded-lg p-5">
                            <h3 className="font-semibold">Completed Forms</h3>
                            <p className="text-2xl font-bold mt-2">{completedForms.length}</p>
                        </div>
                    </div>

                    <div className="border rounded-lg p-5">
                        <h3 className="text-lg font-semibold mb-4">My Forms</h3>

                        {forms.length === 0 ? (
                            <p className="text-gray-500">No forms available.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="p-3">Form Name</th>
                                            <th className="p-3">Required</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3">Submitted Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {forms.map((form) => (
                                            <tr key={form.formTypeId} className="border-b">
                                                <td className="p-3">{form.name}</td>
                                                <td className="p-3">{form.isRequired ? "Yes" : "No"}</td>
                                                <td className="p-3">{form.status || "Not started"}</td>
                                                <td className="p-3">
                                                    {form.submittedDate ? form.submittedDate.slice(0, 10) : "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="border rounded-lg p-5">
                        <h3 className="text-lg font-semibold">Complete a Form</h3>
                        <p className="text-gray-600 mt-2">
                            Online form submission will be available once the clinic's forms system is connected.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}