import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiErrorMessage } from "../../api";
import { addVisitNote, getVisitSummary } from "../../services/nursingApi";
import type { VisitSummary } from "../../types";

// Notes for one visit (appointment_summary). Each note the nurse adds is
// appended with their name and the time, so nothing written earlier —
// including the doctor's — is overwritten. The first note moves the
// patient to "With nurse" on the front desk.
export function NotesTab({ appointmentId, canEdit }: { appointmentId: number | null; canEdit: boolean }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<VisitSummary | null>(null);
  const [text, setText] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!appointmentId) return;
    let ignore = false;
    getVisitSummary(appointmentId)
      .then((data) => {
        if (!ignore) setSummary(data);
      })
      .catch(() => {
        if (!ignore) setSummary(null);
      });
    return () => {
      ignore = true;
    };
  }, [appointmentId, reloadCount]);

  if (!appointmentId) {
    return <p className="text-sm text-gray-500">Notes belong to a visit, and this patient has no visit today.</p>;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !appointmentId) return;
    try {
      await addVisitNote(user.id, appointmentId, text);
      setText("");
      setReloadCount((n) => n + 1);
    } catch (err) {
      alert(`Could not save note: ${apiErrorMessage(err)}`);
    }
  }

  return (
    <div className="space-y-3">
      {summary?.notes ? (
        <p className="whitespace-pre-line rounded border border-gray-200 p-3 text-sm text-gray-800">{summary.notes}</p>
      ) : (
        <p className="text-sm text-gray-500">No notes for this visit yet.</p>
      )}
      {summary?.diagnosis && (
        <p className="text-sm text-gray-700">
          <span className="font-medium">Diagnosis (doctor):</span> {summary.diagnosis}
        </p>
      )}

      {canEdit && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            required
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Triage note, e.g. reason for visit, symptoms, what was done"
            className="block w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800">
            Add note
          </button>
        </form>
      )}
    </div>
  );
}
