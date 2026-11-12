import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api, apiErrorMessage } from "../../api";
import { AdminPage } from "../../components/admin/AdminPage";
import { WeekNav } from "../../components/admin/WeekNav";
import { Modal } from "../../components/Modal";
import { PageError } from "../../components/PortalPage";
import { Section, StatusText } from "../../components/ProfileUI";
import { StatCard } from "../../components/StatCard";
import { formatId } from "../../utils/id";
import { addDays, clinicToday, DAY_NAMES, minutes, mondayOf, percent, showTime, SLOT_STYLE } from "../../utils/weekCalendar";

interface Slot {
  date: string;
  time: string;
  endTime: string;
  officeName: string;
  specialty: string;
  appointmentId: number | null;
  status: string | null;
  patientName: string | null;
}

// pixels for one hour on the calendar
const HOUR_HEIGHT = 80;

// one doctor's schedule as a week calendar, showing every slot behind the utilization numbers
export function AdminScheduleUtilizationDoctor() {
  const { doctorId } = useParams();
  const [params] = useSearchParams();
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";

  const [doctorName, setDoctorName] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState<Slot | null>(null);

  // start on this week when today is in the period, otherwise the first week
  const today = clinicToday();
  const [weekStart, setWeekStart] = useState(mondayOf(today >= from && today <= to ? today : from || today));

  // load the doctor's slots with the report's filters
  useEffect(() => {
    async function loadSlots() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get<{ doctorName: string; slots: Slot[] }>(`/api/admin/data-reports/schedule-utilization/doctors/${doctorId}`, {
          params: {
            from,
            to,
            officeId: params.get("officeId") || undefined,
            specialtyId: params.get("specialtyId") || undefined,
            dayOfWeek: params.get("dayOfWeek") || undefined,
            shiftTypeId: params.get("shiftTypeId") || undefined,
          },
        });
        setDoctorName(res.data.doctorName);
        setSlots(res.data.slots);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadSlots();
  }, [doctorId, from, to, params]);

  // totals for the whole period, same as the doctor's row in the report
  const booked = slots.filter((s) => s.appointmentId).length;
  const noShows = slots.filter((s) => s.status === "No Show").length;
  const completed = slots.filter((s) => s.status === "Completed").length;

  // this week's days, and every slot time the doctor works in the period
  const weekDays = DAY_NAMES.map((_, i) => addDays(weekStart, i));
  // whole hours from the doctor's earliest start to latest end in the period
  const firstHour = Math.floor(Math.min(...slots.map((s) => minutes(s.time))) / 60);
  const lastHour = Math.ceil(Math.max(...slots.map((s) => minutes(s.endTime))) / 60);
  const hours = slots.length ? Array.from({ length: lastHour - firstHour }, (_, i) => firstHour + i) : [];
  // weeks run from the first to the last day of the report period; days outside it are grayed out
  const firstWeek = mondayOf(from);
  const lastWeek = mondayOf(to);
  const shownDays = weekDays;

  const backTo = `/admin/reports/schedule-utilization?${params.toString()}`;

  return (
    <AdminPage
      title={doctorName ? `Dr. ${doctorName}: Schedule` : "Doctor Schedule"}
      description={`Every time slot from the doctor's schedule, ${from} to ${to}. Booked slots show the appointment number.`}
      back={{ to: backTo, label: "Back to Schedule Utilization" }}
    >
      <PageError message={error} />
      {loading && <p className="text-slate-500">Loading schedule...</p>}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label="Slots Offered" value={String(slots.length)} />
            <StatCard label="Booked" value={String(booked)} note={`${completed} completed`} />
            <StatCard label="Open" value={String(slots.length - booked)} />
            <StatCard label="No-Shows" value={String(noShows)} />
            <StatCard label="Utilization" value={percent(booked, slots.length)} note="Booked out of offered" />
          </div>

          <Section title="Weekly Calendar">
            <WeekNav
              weekStart={weekStart}
              lastDay={weekDays[6]}
              from={from}
              to={to}
              firstWeek={firstWeek}
              lastWeek={lastWeek}
              onChange={setWeekStart}
            />

            {slots.length === 0 ? (
              <p className="text-slate-500">This doctor has no scheduled slots for these filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[720px]">
                  {/* day headers */}
                  <div className="flex border-b border-slate-200">
                    <div className="w-16 shrink-0" />
                    {shownDays.map((date, i) => {
                      const daySlots = slots.filter((s) => s.date === date);
                      const dayBooked = daySlots.filter((s) => s.appointmentId).length;
                      const offices = [...new Set(daySlots.map((s) => `${s.officeName}|${s.specialty}`))];
                      const outside = date < from || date > to;
                      return (
                        <div key={date} className={`min-w-0 flex-1 border-l border-slate-100 px-2 pb-2 ${outside ? "opacity-40" : ""}`}>
                          <p className="flex items-center gap-2">
                            <span
                              className={`rounded-lg px-2 py-0.5 text-lg font-semibold ${date === today ? "bg-navy text-white" : "text-slate-800"}`}
                            >
                              {Number(date.slice(8))}
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{DAY_NAMES[i]}</span>
                          </p>
                          {offices.map((o) => (
                            <div key={o} title={o.replace("|", " · ")} className="text-xs text-slate-500">
                              <p className="truncate">{o.split("|")[0]}</p>
                              <p className="truncate">{o.split("|")[1]}</p>
                            </div>
                          ))}
                          {daySlots.length > 0 && (
                            <p className="text-xs text-slate-600">
                              {dayBooked} of {daySlots.length} booked
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* hour grid with the booked appointments placed at their times */}
                  <div className="mt-3 flex">
                    <div className="relative w-16 shrink-0" style={{ height: hours.length * HOUR_HEIGHT }}>
                      {hours.map((h, i) => (
                        <span key={h} className="absolute right-2 -translate-y-1/2 text-xs text-slate-500" style={{ top: i * HOUR_HEIGHT }}>
                          {h % 12 || 12} {h >= 12 ? "PM" : "AM"}
                        </span>
                      ))}
                    </div>
                    {shownDays.map((date) => (
                      <div key={date} className="relative flex-1 border-l border-slate-100" style={{ height: hours.length * HOUR_HEIGHT }}>
                        {hours.map((h, i) => (
                          <div key={h} className="absolute inset-x-0 border-t border-slate-100" style={{ top: i * HOUR_HEIGHT }} />
                        ))}
                        {slots
                          .filter((s) => s.date === date && s.appointmentId)
                          .map((s) => (
                            <button
                              key={s.appointmentId}
                              type="button"
                              onClick={() => setViewing(s)}
                              className={`absolute inset-x-1 overflow-hidden rounded border-l-4 px-1.5 py-0.5 text-left text-xs hover:brightness-95 ${SLOT_STYLE[s.status ?? ""] ?? "border-slate-400 bg-slate-50 text-slate-700"}`}
                              style={{
                                top: ((minutes(s.time) - hours[0] * 60) / 60) * HOUR_HEIGHT + 1,
                                height: ((minutes(s.endTime) - minutes(s.time)) / 60) * HOUR_HEIGHT - 2,
                              }}
                            >
                              <span className="block font-mono font-semibold">#{formatId(s.appointmentId ?? 0)}</span>
                              <span className="block truncate">
                                {showTime(s.time).slice(0, -3)} - {showTime(s.endTime).slice(0, -3)}
                              </span>
                            </button>
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Section>
        </>
      )}

      {viewing && viewing.appointmentId && (
        <Modal title={`Appointment #${formatId(viewing.appointmentId)}`} onClose={() => setViewing(null)}>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div><dt className="text-slate-500">Patient</dt><dd className="font-medium text-slate-900">{viewing.patientName}</dd></div>
            <div><dt className="text-slate-500">Status</dt><dd className="font-medium"><StatusText status={viewing.status ?? ""} /></dd></div>
            <div><dt className="text-slate-500">Date</dt><dd className="font-medium text-slate-900">{viewing.date}</dd></div>
            <div><dt className="text-slate-500">Time</dt><dd className="font-medium text-slate-900">{showTime(viewing.time)}</dd></div>
            <div><dt className="text-slate-500">Office</dt><dd className="font-medium text-slate-900">{viewing.officeName}</dd></div>
            <div><dt className="text-slate-500">Specialty</dt><dd className="font-medium text-slate-900">{viewing.specialty}</dd></div>
          </dl>
        </Modal>
      )}
    </AdminPage>
  );
}
