import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { AdminPage } from "../../components/admin/AdminPage";
import { WeekNav } from "../../components/admin/WeekNav";
import { Modal } from "../../components/Modal";
import { PageError } from "../../components/PortalPage";
import { Section, StatusText } from "../../components/ProfileUI";
import { StatCard } from "../../components/StatCard";
import { formatId } from "../../utils/id";
import { addDays, clinicToday, DAY_NAMES, minutes, mondayOf, percent, showDate, showTime } from "../../utils/weekCalendar";

interface Appointment {
  appointmentId: number;
  date: string;
  time: string;
  endTime: string;
  doctorName: string;
  officeName: string;
  specialty: string;
  patientName: string;
  status: string;
}

interface CalendarData {
  summary: { offered: number; booked: number; completed: number; noShows: number; firstTime: string | null; lastTime: string | null };
  days: { date: string; offered: number; booked: number }[];
  appointments: Appointment[];
}

// pixels for one hour; taller than the doctor calendar so each block fits its count, time and status dots
const HOUR_HEIGHT = 120;

// most status dots shown in one block before it says +the rest
const MAX_DOTS = 5;

// dot color for each appointment's status inside a time slot block
const DOT_STYLE: Record<string, string> = {
  Scheduled: "bg-blue-400",
  Completed: "bg-green-500",
  "No Show": "bg-red-400",
};

// every doctor's appointments as a Monday to Friday week calendar, behind the By Day of the Week numbers
export function AdminScheduleUtilizationCalendar() {
  const [params] = useSearchParams();
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";

  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openSlot, setOpenSlot] = useState<Appointment[] | null>(null);
  const [viewing, setViewing] = useState<Appointment | null>(null);

  // start on this week when today is in the period, otherwise the first week
  const today = clinicToday();
  const [weekStart, setWeekStart] = useState(mondayOf(today >= from && today <= to ? today : addDays(from || today, 2)));

  // load every doctor's appointments with the report's filters
  useEffect(() => {
    async function loadCalendar() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get<CalendarData>("/api/admin/data-reports/schedule-utilization/calendar", {
          params: {
            from,
            to,
            officeId: params.get("officeId") || undefined,
            doctorId: params.get("doctorId") || undefined,
            specialtyId: params.get("specialtyId") || undefined,
            dayOfWeek: params.get("dayOfWeek") || undefined,
            shiftTypeId: params.get("shiftTypeId") || undefined,
          },
        });
        setData(res.data);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadCalendar();
  }, [from, to, params]);

  // Monday to Friday of the week being shown
  const weekDays = DAY_NAMES.slice(0, 5).map((_, i) => addDays(weekStart, i));

  // a period starting on a weekend begins on the next Monday
  const firstWeek = mondayOf(addDays(from, 2));
  const lastWeek = mondayOf(to);

  // whole hours from the earliest start to the latest end in the period
  const s = data?.summary;
  const firstHour = s?.firstTime ? Math.floor(minutes(s.firstTime) / 60) : 8;
  const lastHour = s?.lastTime ? Math.ceil(minutes(s.lastTime) / 60) : 17;
  const hours = Array.from({ length: lastHour - firstHour }, (_, i) => firstHour + i);

  const backTo = `/admin/reports/schedule-utilization?${params.toString()}`;

  return (
    <AdminPage
      title="All Doctors: Weekly Calendar"
      description={`Every booked appointment from all doctors' schedules, ${from} to ${to}. Open slots are left blank.`}
      back={{ to: backTo, label: "Back to Schedule Utilization" }}
    >
      <PageError message={error} />
      {loading && <p className="text-slate-500">Loading calendar...</p>}

      {!loading && data && s && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label="Slots Offered" value={String(s.offered)} />
            <StatCard label="Booked" value={String(s.booked)} note={`${s.completed} completed`} />
            <StatCard label="Open" value={String(s.offered - s.booked)} />
            <StatCard label="No-Shows" value={String(s.noShows)} />
            <StatCard label="Utilization" value={percent(s.booked, s.offered)} note="Booked out of offered" />
          </div>

          <Section title="Weekly Calendar">
            <WeekNav weekStart={weekStart} lastDay={weekDays[4]} from={from} to={to} firstWeek={firstWeek} lastWeek={lastWeek} onChange={setWeekStart} />

            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                {/* day headers */}
                <div className="flex border-b border-slate-200">
                  <div className="w-16 shrink-0" />
                  {weekDays.map((date, i) => {
                    const day = data.days.find((d) => d.date === date);
                    const outside = date < from || date > to;
                    return (
                      <div key={date} className={`min-w-0 flex-1 border-l border-slate-100 px-2 pb-2 ${outside ? "opacity-40" : ""}`}>
                        <p className="flex items-center gap-2">
                          <span className={`rounded-lg px-2 py-0.5 text-lg font-semibold ${date === today ? "bg-navy text-white" : "text-slate-800"}`}>
                            {Number(date.slice(8))}
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{DAY_NAMES[i]}</span>
                        </p>
                        {day && (
                          <p className="text-xs text-slate-600">
                            {day.booked} of {day.offered} booked
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* hour grid with every doctor's appointments; ones at the same time sit side by side */}
                <div className="mt-3 flex">
                  <div className="relative w-16 shrink-0" style={{ height: hours.length * HOUR_HEIGHT }}>
                    {hours.map((h, i) => (
                      <span key={h} className="absolute right-2 -translate-y-1/2 text-xs text-slate-500" style={{ top: i * HOUR_HEIGHT }}>
                        {h % 12 || 12} {h >= 12 ? "PM" : "AM"}
                      </span>
                    ))}
                  </div>
                  {weekDays.map((date) => {
                    const dayAppointments = data.appointments.filter((a) => a.date === date);
                    const times = [...new Set(dayAppointments.map((a) => a.time))];
                    return (
                      <div key={date} className="relative min-w-0 flex-1 border-l border-slate-100" style={{ height: hours.length * HOUR_HEIGHT }}>
                        {hours.map((h, i) => (
                          <div key={h} className="absolute inset-x-0 border-t border-slate-100" style={{ top: i * HOUR_HEIGHT }} />
                        ))}
                        {/* one block per time slot, however many doctors have an appointment then */}
                        {times.map((time) => {
                          const group = dayAppointments.filter((a) => a.time === time);
                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() => {
                                setOpenSlot(group);
                                setViewing(null);
                              }}
                              className="absolute inset-x-1 overflow-hidden rounded border-l-4 border-slate-400 bg-slate-50 px-1.5 py-0.5 text-left text-xs text-slate-800 hover:bg-slate-100"
                              style={{
                                top: ((minutes(time) - firstHour * 60) / 60) * HOUR_HEIGHT + 1,
                                height: ((minutes(group[0].endTime) - minutes(time)) / 60) * HOUR_HEIGHT - 2,
                              }}
                            >
                              <span className="block truncate font-semibold">
                                {group.length} appointment{group.length === 1 ? "" : "s"}
                              </span>
                              <span className="block truncate">
                                {showTime(time).slice(0, -3)} - {showTime(group[0].endTime).slice(0, -3)}
                              </span>
                              {/* a colored dot for each appointment's status, up to 5, then +the rest */}
                              <span className="mt-0.5 flex items-center gap-1">
                                {group.slice(0, MAX_DOTS).map((a) => (
                                  <span key={a.appointmentId} className={`h-2 w-2 shrink-0 rounded-full ${DOT_STYLE[a.status] ?? "bg-slate-400"}`} />
                                ))}
                                {group.length > MAX_DOTS && <span className="text-[10px] font-semibold text-slate-500">+{group.length - MAX_DOTS}</span>}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Section>
        </>
      )}

      {/* the time slot's appointments, or one appointment's details with a way back to the list */}
      {openSlot && !viewing && (
        <Modal
          title={`${showDate(openSlot[0].date)}, ${showTime(openSlot[0].time)} - ${showTime(openSlot[0].endTime)}`}
          onClose={() => setOpenSlot(null)}
        >
          <p className="mb-3 text-sm text-slate-600">
            {openSlot.length} appointment{openSlot.length === 1 ? "" : "s"} in this time slot. Choose one to see its details.
          </p>
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
            {openSlot.map((a) => (
              <li key={a.appointmentId}>
                <button
                  type="button"
                  onClick={() => setViewing(a)}
                  className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left hover:bg-slate-50"
                >
                  <span>
                    <span className="block font-medium text-navy">Dr. {a.doctorName}</span>
                    <span className="block text-xs text-slate-500">
                      <span className="font-mono">#{formatId(a.appointmentId)}</span> · {a.patientName} · {a.officeName}
                    </span>
                  </span>
                  <StatusText status={a.status} />
                </button>
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {viewing && (
        <Modal title={`Appointment #${formatId(viewing.appointmentId)}`} onClose={() => { setViewing(null); setOpenSlot(null); }}>
          <button type="button" onClick={() => setViewing(null)} className="mb-4 flex items-center gap-1 text-sm font-medium text-navy hover:underline">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to this time slot
          </button>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div><dt className="text-slate-500">Patient</dt><dd className="font-medium text-slate-900">{viewing.patientName}</dd></div>
            <div><dt className="text-slate-500">Status</dt><dd className="font-medium"><StatusText status={viewing.status} /></dd></div>
            <div><dt className="text-slate-500">Doctor</dt><dd className="font-medium text-slate-900">Dr. {viewing.doctorName}</dd></div>
            <div><dt className="text-slate-500">Specialty</dt><dd className="font-medium text-slate-900">{viewing.specialty}</dd></div>
            <div><dt className="text-slate-500">Date</dt><dd className="font-medium text-slate-900">{viewing.date}</dd></div>
            <div><dt className="text-slate-500">Time</dt><dd className="font-medium text-slate-900">{showTime(viewing.time)} - {showTime(viewing.endTime)}</dd></div>
            <div><dt className="text-slate-500">Office</dt><dd className="font-medium text-slate-900">{viewing.officeName}</dd></div>
          </dl>
        </Modal>
      )}
    </AdminPage>
  );
}
