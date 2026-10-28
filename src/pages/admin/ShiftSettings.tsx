import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { apiErrorMessage } from "../../api";
import { AdminPage } from "../../components/admin/AdminPage";
import { ActiveBadge } from "../../components/admin/StatusBadges";
import { ConfirmPanel } from "../../components/admin/StatusControls";
import { ADMIN_DANGER_BUTTON, ADMIN_PRIMARY_BUTTON, ADMIN_SECONDARY_BUTTON } from "../../components/admin/styles";
import { Field } from "../../components/FormControls";
import {
  createShiftType,
  createTimeSlot,
  getShiftTypes,
  setShiftTypeStatus,
  setTimeSlotStatus,
  updateShiftType,
  updateTimeSlot,
} from "../../services/adminApi";
import type { ShiftInput, ShiftType } from "../../services/adminApi";
import { ScheduleTabs } from "./Schedules";

const TEXT_BUTTON = "text-sm font-medium text-navy hover:text-teal-700 disabled:opacity-60";
const EMPTY_FORM: ShiftInput = { name: "", startTime: "", endTime: "" };

interface Notice {
  shiftTypeId: number | null;
  kind: "success" | "error";
  text: string;
}

function NoticeText({ notice }: { notice: Notice }) {
  return notice.kind === "success" ? (
    <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice.text}</p>
  ) : (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{notice.text}</p>
  );
}

interface HoursFormProps {
  title: string;
  withName: boolean;
  values: ShiftInput;
  saving: boolean;
  submitLabel: string;
  onChange: (values: ShiftInput) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

// small inline form for shift or time slot hours
function HoursForm({ title, withName, values, saving, submitLabel, onChange, onSubmit, onCancel }: HoursFormProps) {
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (values.startTime >= values.endTime) {
      setError("End time must be after start time.");
      return;
    }
    setError("");
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <div className={`mt-3 grid gap-4 ${withName ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:max-w-md"}`}>
        {withName && (
          <Field label="Shift Name" required maxLength={50} value={values.name} onChange={(e) => onChange({ ...values, name: e.target.value })} />
        )}
        <Field label="Start Time" type="time" required value={values.startTime} onChange={(e) => onChange({ ...values, startTime: e.target.value })} />
        <Field label="End Time" type="time" required value={values.endTime} onChange={(e) => onChange({ ...values, endTime: e.target.value })} />
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className={ADMIN_PRIMARY_BUTTON}>
          {saving ? "Saving..." : submitLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} className={ADMIN_SECONDARY_BUTTON}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function AdminShiftSettings() {
  const [shifts, setShifts] = useState<ShiftType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // which inline form or confirmation is open, e.g. "new-shift", "shift-3", "new-slot-3", "slot-12", "confirm-3"
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState<ShiftInput>(EMPTY_FORM);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);
  // blocks a second request before the disabled buttons re-render
  const busy = useRef(false);

  useEffect(() => {
    let active = true;

    async function loadShifts() {
      try {
        const data = await getShiftTypes();
        if (active) setShifts(data);
      } catch (err) {
        if (active) setLoadError(apiErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadShifts();
    return () => {
      active = false;
    };
  }, []);

  function openForm(key: string | null, values: ShiftInput = EMPTY_FORM) {
    setOpen(key);
    setForm(values);
    setNotice(null);
  }

  async function run(shiftTypeId: number | null, action: () => Promise<unknown>, successText: string) {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setNotice(null);
    try {
      await action();
      setOpen(null);
      setShifts(await getShiftTypes());
      setNotice({ shiftTypeId, kind: "success", text: successText });
    } catch (err) {
      if (open?.startsWith("confirm-")) setOpen(null);
      setNotice({ shiftTypeId, kind: "error", text: apiErrorMessage(err) });
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  const noticeFor = (shiftTypeId: number | null) => (notice && notice.shiftTypeId === shiftTypeId ? <NoticeText notice={notice} /> : null);

  return (
    <AdminPage
      title="Schedules"
      description="Define working shifts and the appointment time slots inside each one."
      actions={
        <button type="button" onClick={() => openForm("new-shift")} disabled={saving} className={ADMIN_PRIMARY_BUTTON}>
          Add Shift
        </button>
      }
    >
      <ScheduleTabs />

      {open === "new-shift" && (
        <HoursForm
          title="New Shift"
          withName
          values={form}
          saving={saving}
          submitLabel="Create Shift"
          onChange={setForm}
          onSubmit={() => run(null, () => createShiftType(form), "Shift created.")}
          onCancel={() => openForm(null)}
        />
      )}
      {noticeFor(null)}

      {loading && <p className="text-sm text-slate-600">Loading shifts...</p>}
      {loadError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Shifts could not be loaded. {loadError}
        </p>
      )}
      {!loading && !loadError && shifts.length === 0 && (
        <section className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <p className="font-medium text-navy">No shifts have been set up yet.</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Add a shift such as Morning (08:00–12:00), then add the appointment time slots inside it.
          </p>
        </section>
      )}

      {shifts.map((shift) => {
        const id = shift.shiftTypeId;
        return (
          <section key={id} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">{shift.name}</h3>
                  <ActiveBadge plain isActive={shift.isActive} />
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {shift.startTime}–{shift.endTime} · used by {shift.activeScheduleCount} active schedule{shift.activeScheduleCount === 1 ? "" : "s"}
                </p>
              </div>
              {open === null && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openForm(`shift-${id}`, { name: shift.name, startTime: shift.startTime, endTime: shift.endTime })}
                    className={ADMIN_SECONDARY_BUTTON}
                  >
                    Edit Shift
                  </button>
                  {shift.isActive ? (
                    <button type="button" onClick={() => openForm(`confirm-${id}`)} className={ADMIN_DANGER_BUTTON}>
                      Deactivate
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => run(id, () => setShiftTypeStatus(id, true), "Shift activated.")}
                      disabled={saving}
                      className={ADMIN_PRIMARY_BUTTON}
                    >
                      Activate
                    </button>
                  )}
                </div>
              )}
            </div>

            {open === `shift-${id}` && (
              <HoursForm
                title="Edit Shift"
                withName
                values={form}
                saving={saving}
                submitLabel="Save Shift"
                onChange={setForm}
                onSubmit={() => run(id, () => updateShiftType(id, form), "Shift saved.")}
                onCancel={() => openForm(null)}
              />
            )}
            {open === `confirm-${id}` && (
              <ConfirmPanel
                text={`Deactivate the ${shift.name} shift? It can't be used for new schedules. Shifts used by active schedules or upcoming appointments can't be deactivated.`}
                confirmLabel="Deactivate Shift"
                saving={saving}
                onConfirm={() => run(id, () => setShiftTypeStatus(id, false), "Shift deactivated.")}
                onCancel={() => openForm(null)}
              />
            )}
            {noticeFor(id)}

            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-700">Time Slots</p>
                {open === null && (
                  <button type="button" onClick={() => openForm(`new-slot-${id}`)} className={TEXT_BUTTON}>
                    + Add Time Slot
                  </button>
                )}
              </div>

              {open === `new-slot-${id}` && (
                <div className="mt-3">
                  <HoursForm
                    title={`New time slot within ${shift.startTime}–${shift.endTime}`}
                    withName={false}
                    values={form}
                    saving={saving}
                    submitLabel="Add Slot"
                    onChange={setForm}
                    onSubmit={() => run(id, () => createTimeSlot(id, form), "Time slot added.")}
                    onCancel={() => openForm(null)}
                  />
                </div>
              )}

              {shift.timeSlots.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No time slots yet.</p>
              ) : (
                <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {shift.timeSlots.map((slot) =>
                    open === `slot-${slot.timeSlotId}` ? (
                      <li key={slot.timeSlotId} className="p-3">
                        <HoursForm
                          title="Edit Time Slot"
                          withName={false}
                          values={form}
                          saving={saving}
                          submitLabel="Save Slot"
                          onChange={setForm}
                          onSubmit={() => run(id, () => updateTimeSlot(slot.timeSlotId, form), "Time slot saved.")}
                          onCancel={() => openForm(null)}
                        />
                      </li>
                    ) : (
                      <li key={slot.timeSlotId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-sm">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-700">{slot.startTime}–{slot.endTime}</span>
                          <ActiveBadge plain isActive={slot.isActive} />
                        </div>
                        {open === null && (
                          <div className="flex gap-4">
                            <button
                              type="button"
                              onClick={() => openForm(`slot-${slot.timeSlotId}`, { name: "", startTime: slot.startTime, endTime: slot.endTime })}
                              className={TEXT_BUTTON}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                run(
                                  id,
                                  () => setTimeSlotStatus(slot.timeSlotId, !slot.isActive),
                                  slot.isActive ? "Time slot deactivated." : "Time slot activated."
                                )
                              }
                              disabled={saving}
                              className={slot.isActive ? "text-sm font-medium text-red-700 hover:text-red-800 disabled:opacity-60" : TEXT_BUTTON}
                            >
                              {slot.isActive ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        )}
                      </li>
                    )
                  )}
                </ul>
              )}
            </div>
          </section>
        );
      })}
    </AdminPage>
  );
}
