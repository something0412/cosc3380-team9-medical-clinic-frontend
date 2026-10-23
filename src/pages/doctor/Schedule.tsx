import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
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
  const [upcomingDays, setUpcomingDays] = useState<{ date: string; count: number }[]>([]);
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
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
        <p className="mt-1 text-gray-600">Your weekly working hours. An administrator sets these.</p>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {loading && <p>Loading schedule...</p>}

      {!loading && (
        <>
          <Section title="Weekly Hours">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
              {DAYS.map((day) => {
                const shift = schedule.find((s) => s.dayOfWeek === day);
                return (
                  <div
                    key={day}
                    className={`rounded-lg border p-3 text-sm ${shift ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"}`}
                  >
                    <p className="font-semibold text-gray-900">{day}</p>
                    {shift ? (
                      <>
                        <p className="mt-1 text-gray-800">{shift.startTime} - {shift.endTime}</p>
                        <p className="text-gray-600">{shift.shift}</p>
                        <p className="text-gray-600">{shift.officeName}</p>
                        <p className="text-gray-600">{shift.specialty}</p>
                      </>
                    ) : (
                      <p className="mt-1 text-gray-400">Off</p>
                    )}
                  </div>
                );
              })}
            </div>
            {schedule.length === 0 && (
              <p className="mt-4 text-sm text-gray-500">No weekly hours set yet. Ask an administrator to add your schedule.</p>
            )}
          </Section>

          <Section title="Booked in the Next 2 Weeks">
            {upcomingDays.length === 0 ? (
              <p className="text-gray-500">No appointments booked in the next 2 weeks.</p>
            ) : (
              <ul className="divide-y divide-gray-100 text-sm">
                {upcomingDays.map((d) => (
                  <li key={d.date} className="flex justify-between py-2">
                    <span className="font-medium text-gray-900">{d.date}</span>
                    <span className="text-gray-600">{d.count} appointment(s)</span>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/doctor/appointments" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
              See all appointments
            </Link>
          </Section>
        </>
      )}
    </div>
  );
}
