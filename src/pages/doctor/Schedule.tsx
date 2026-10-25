import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { PageError, PortalPage } from "../../components/PortalPage";
import { Section } from "../../components/ProfileUI";

interface ScheduleDay {
  dayOfWeek: string;
  officeName: string;
  specialty: string;
  shift: string;
  startTime: string;
  endTime: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function DoctorSchedule() {
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [upcomingDays, setUpcomingDays] = useState<{ date: string; appointments: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // load my schedule
  useEffect(() => {
    async function loadSchedule() {
      try {
        const res = await api.get("/api/doctor/schedule");
        setSchedule(res.data.schedule);
        setUpcomingDays(res.data.upcomingDays);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadSchedule();
  }, []);

  return (
    <PortalPage eyebrow="Doctor" title="My Schedule" description="Your weekly working hours. An administrator sets these.">
      <PageError message={error} />
      {loading && <p className="text-slate-500">Loading schedule...</p>}

      {!loading && (
        <>
          <Section title="Weekly Hours">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
              {DAYS.map((day) => {
                const shift = schedule.find((s) => s.dayOfWeek === day);
                return (
                  <div
                    key={day}
                    className={`rounded-lg border p-3 text-sm ${shift ? "border-teal-200 bg-teal-50" : "border-slate-200 bg-slate-50"}`}
                  >
                    <p className="font-semibold text-navy">{day}</p>
                    {shift ? (
                      <>
                        <p className="mt-1 text-slate-800">{shift.startTime} - {shift.endTime}</p>
                        <p className="text-slate-600">{shift.shift}</p>
                        <p className="text-slate-600">{shift.officeName}</p>
                        <p className="text-slate-600">{shift.specialty}</p>
                      </>
                    ) : (
                      <p className="mt-1 text-slate-400">Off</p>
                    )}
                  </div>
                );
              })}
            </div>
            {schedule.length === 0 && (
              <p className="mt-4 text-sm text-slate-500">No weekly hours set yet. Ask an administrator to add your schedule.</p>
            )}
          </Section>

          <Section title="Booked in the Next 2 Weeks">
            {upcomingDays.length === 0 ? (
              <p className="text-slate-500">No appointments booked in the next 2 weeks.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {upcomingDays.map((d) => (
                  <li key={d.date} className="flex justify-between py-2">
                    <span className="font-medium text-slate-900">{d.date}</span>
                    <span className="text-slate-600">{d.appointments} appointment(s)</span>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/doctor/appointments" className="mt-3 inline-block text-sm font-medium text-navy hover:text-teal-700 hover:underline">
              See all appointments
            </Link>
          </Section>
        </>
      )}
    </PortalPage>
  );
}
