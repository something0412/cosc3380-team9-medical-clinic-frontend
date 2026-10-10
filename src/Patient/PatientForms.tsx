
import { useState, type SubmitEvent } from "react";
export function PatientForms() {
    const [reason, setReason] = useState("");
    const [allergies, setAllergies] = useState("");
    const [medications, setMedications] = useState("");
    const [consent, setConsent] = useState(false);
    const [preview, setPreview] = useState(false);
    function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setPreview(true);
    }
    return (
        <div>
            <h2>Patient Forms</h2>
            <p>Complete your medical forms and view your submission history.</p>

            <h3>Required Forms</h3>
            <p>Your required forms will appear here once your account is connected.</p>

            <h3>Patient Intake Form</h3>
            <p>This is a demo form. Your answers will not be saved yet.</p>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Reason for Visit</label>
                    <textarea value={reason} onChange={(e) => {
                        setReason(e.target.value);
                        setPreview(false);
                    }} required />
                </div>

                <div>
                    <label>Allergies</label>
                    <input type="text" value={allergies} onChange={(e) => {
                        setAllergies(e.target.value);
                        setPreview(false);
                    }} placeholder="Enter allergies or None" />
                </div>

                <div>
                    <label>Current Medications</label>
                    <input type="text" value={medications} onChange={(e) => {
                        setMedications(e.target.value);
                        setPreview(false);
                    }} placeholder="Enter medications or None" />
                </div>

                <div>
                    <label>
                        <input type="checkbox" checked={consent}
                            onChange={(e) => {
                                setConsent(e.target.checked);
                                setPreview(false);
                            }} required />
                        I confirm that the information provided is accurate.
                    </label>
                </div>

                <button type="submit">Preview Form</button>
            </form>

            {preview && (
                <div>
                    <h3>Form Preview</h3>
                    <p>Reason: {reason}</p>
                    <p>Allergies: {allergies || "None"}</p>
                    <p>Medications: {medications || "None"}</p>
                    <p>Information confirmed: {consent ? "Yes" : "No"}</p>
                    <p>This form has not been submitted to the clinic.</p>
                </div>
            )}

            <h3>Submission History</h3>
            <p>Your submitted forms will appear here once connected to the database.</p>
        </div>
    );
}