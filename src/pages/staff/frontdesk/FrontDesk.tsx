import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { authErrorMessage } from "../../../services/authApi";
import { getAppointments, updateVisit } from "../../../services/frontDeskApi";
import type { Appointment } from "../../../types";
import { timeOf, today } from "../../../utils/dates";

// Front Desk (receptionists): the office's appointments for one day, in
// time order. Check patients in when they arrive and out when they leave;
// a checked-out visit is Completed and can be billed.
export function FrontDesk() {
  const { user } = useAuth();
  const [date, setDate] = useState(today());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState("");
  // Bumping this re-runs the effect below (the Refresh button).
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let ignore = false;
    getAppointments(date, user?.officeId)
      .then((data) => {
        if (!ignore) {
          setAppointments(data);
          setError("");
        }
      })
      .catch(() => {
        if (!ignore) setError("Could not load appointments.");
      });
    return () => {
      ignore = true;
    };
  }, [date, user?.officeId, reloadCount]);

  async function handleVisit(appointmentId: number, action: "check-in" | "check-out" | "no-show") {
    if (!user) return;
    try {
      const updated = await updateVisit(user.id, appointmentId, action);
      setAppointments(appointments.map((a) => (a.appointmentId === appointmentId ? updated : a)));
    } catch (err) {
      alert(`Could not ${action.replace("-", " ")}: ${authErrorMessage(err)}`);
    }
  }

  const isToday = date === today();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Front Desk</h1>
          <p className="mt-1 text-sm text-gray-500">Check patients in and out.</p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded border border-gray-300 px-3 py-1 text-sm"
          />
          <button
            type="button"
            onClick={() => setReloadCount((n) => n + 1)}
            className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-6 space-y-3">
        {appointments.length === 0 ? (
          <p className="text-sm text-gray-500">No appointments on this day.</p>
        ) : (
          appointments.map((a) => (
            <article
              key={a.appointmentId}
              className="flex flex-wrap items-center justify-between gap-3 rounded border border-gray-200 bg-white p-4"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {timeOf(a.scheduledAt)} — {a.patientName}
                </p>
                <p className="text-sm text-gray-600">
                  {a.specialty} · {a.doctorName}
                </p>
                <p className="text-sm text-gray-600">{visitStatus(a)}</p>
                {/* Things to sort out at the desk before the visit. */}
                {a.missingForms > 0 && (
                  <p className="text-sm font-medium text-amber-700">
                    {a.missingForms} required form{a.missingForms === 1 ? "" : "s"} missing
                  </p>
                )}
                {a.insuranceStatus !== "Verified" && a.status === "Scheduled" && (
                  <p className="text-sm text-amber-700">
                    {a.insuranceStatus ? `Insurance ${a.insuranceStatus.toLowerCase()}` : "No insurance on file"}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                {/* Check-in only on the day of the visit (the backend enforces this too). */}
                {a.status === "Scheduled" && !a.checkedInAt && isToday && (
                  <ActionButton onClick={() => handleVisit(a.appointmentId, "check-in")}>Check in</ActionButton>
                )}
                {a.checkedInAt && !a.checkedOutAt && (
                  <ActionButton onClick={() => handleVisit(a.appointmentId, "check-out")}>Check out</ActionButton>
                )}
                {a.status === "Scheduled" && !a.checkedInAt && date <= today() && (
                  <ActionButton onClick={() => handleVisit(a.appointmentId, "no-show")}>No show</ActionButton>
                )}
                {a.status === "Completed" && (
                  <Link
                    to={`/staff/billing?patientId=${a.patientId}&appointmentId=${a.appointmentId}`}
                    className="text-sm font-medium text-blue-700 hover:underline"
                  >
                    Bill visit
                  </Link>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

// One line saying where the visit stands, with check-in/out times.
function visitStatus(a: Appointment) {
  if (a.checkedInAt && a.checkedOutAt) {
    return `Checked in at ${timeOf(a.checkedInAt)} · checked out at ${timeOf(a.checkedOutAt)}`;
  }
  if (a.checkedInAt) return `Checked in at ${timeOf(a.checkedInAt)}`;
  return a.status;
}

function ActionButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="text-sm font-medium text-blue-700 hover:underline">
      {children}
    </button>
  );
}
