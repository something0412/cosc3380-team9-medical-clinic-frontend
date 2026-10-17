import { useEffect, useState } from "react";
import { api } from "../../api";

interface PatientProfileData {
    patientId: number;
    firstName: string;
    lastName: string;
    dob: string;
    gender: string | null;
    phone: string;
    email: string | null;
    address: string | null;
    isActive: boolean;
}

export function PatientProfile() {
    const [profile, setProfile] = useState<PatientProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadProfile() {
            try {
                const response = await api.get<PatientProfileData>("/api/patient/profile");
                if (active) setProfile(response.data);
            } catch {
                if (active) setError("Patient profile could not be loaded.");
            } finally {
                if (active) setLoading(false);
            }
        }

        loadProfile();
        return () => { active = false; };
    }, []);

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-bold">My Profile</h2>
                <p className="text-gray-600 mt-1">
                    View your personal and contact information.
                </p>
            </div>

            {loading && <p>Loading profile...</p>}
            {error && <p className="text-red-600">{error}</p>}

            {!loading && !error && !profile && (
                <p className="text-gray-500">No profile information found.</p>
            )}

            {profile && (
                <>
                    <div className="border rounded-lg p-5">
                        <h3 className="text-lg font-semibold mb-4">Personal Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Patient ID</p>
                                <p className="font-medium">{profile.patientId}</p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">Account Status</p>
                                <p className="font-medium">
                                    {profile.isActive ? "Active" : "Inactive"}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">First Name</p>
                                <p className="font-medium">{profile.firstName}</p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">Last Name</p>
                                <p className="font-medium">{profile.lastName}</p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">Date of Birth</p>
                                <p className="font-medium">{profile.dob.slice(0, 10)}</p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">Gender</p>
                                <p className="font-medium">{profile.gender || "Not provided"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-lg p-5">
                        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Phone Number</p>
                                <p className="font-medium">{profile.phone}</p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">Email Address</p>
                                <p className="font-medium">{profile.email || "Not provided"}</p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">Address</p>
                                <p className="font-medium">{profile.address || "Not provided"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-lg p-5">
                        <h3 className="text-lg font-semibold">Update Profile</h3>
                        <p className="text-gray-600 mt-2">
                            Profile editing will be available once account management is connected.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}