import { useState } from "react";
export function PatientForms(){
    const [reason, setReason] = useState("");
    const [notes, setNotes] = useState("");
    const [preview, setPreview] = useState(false);
    function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setPreview(true);
    }
    return (
        <div>
            <h2>Patient Forms</h2>
            <p>View and complete forms required by the clinic.</p>

            <h3>Required Forms</h3>
            <p>Your required forms will appear here once your account is connected.</p>

            <h3>Patient Intake Form (Demo)</h3>
            <p>This is a practice form. Your answers will not be saved yet.</p>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="reason">Reason for visit</label>
                    <textarea id="reason" value={reason} onChange={(e) => { setReason(e.target.value); setPreview(false);}}
                    required
                    /> 
                </div>

                <div>
                    <label htmlFor="notes">Additional notes (optional)</label>
                    <textarea id="notes" value={notes} onChange={(e) => { setNotes(e.target.value); setPreview(false);}}
                    />
                </div>

                <button type="submit">Preview Form</button>
            </form>

            {preview && (
                <div>
                    <h3>Form Preview</h3>
                    <p><strong>Reason:</strong> {reason}</p>
                    <p><strong>Notes:</strong> {notes|| "None"}</p>
                    <p>This is only a preview. The form has not been submitted.</p>
                </div>
            )}

            <h3>My Submitted Forms</h3>
            <p>No submission history is available yet.</p>
        </div>
    );
}