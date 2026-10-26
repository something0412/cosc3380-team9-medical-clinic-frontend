import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { apiErrorMessage } from "../../api";
import { AdminPage } from "../../components/admin/AdminPage";
import { ActiveBadge } from "../../components/admin/StatusBadges";
import { ConfirmPanel, StatusRow } from "../../components/admin/StatusControls";
import { ADMIN_DANGER_BUTTON, ADMIN_PRIMARY_BUTTON, ADMIN_SECONDARY_BUTTON } from "../../components/admin/styles";
import { SelectField } from "../../components/FormControls";
import { InfoGrid, InfoItem, Section } from "../../components/ProfileUI";
import {
  WEEKDAYS,
  createSchedule,
  getDoctorOptions,
  getOffices,
  getSchedule,
  getShiftTypes,
  parseRouteId,
  setScheduleStatus,
  updateSchedule,
} from "../../services/adminApi";
import type { DoctorOption, Office, Schedule, ScheduleAssignment, ShiftType } from "../../services/adminApi";
import { formatId } from "../../utils/id";

const ERROR_BOX = "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700";
const SUCCESS_BOX = "rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800";

interface ScheduleFormProps {
  schedule?: Schedule;
  cancelTo: string;
  submitLabel: string;
  onSubmit: (input: ScheduleAssignment & { doctorId: number; dayOfWeek: string }) => Promise<void>;
}

// shared add/edit form; doctor and weekday are fixed when editing
function ScheduleForm({ schedule, cancelTo, submitLabel, onSubmit }: ScheduleFormProps) {
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [shifts, setShifts] = useState<ShiftType[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [doctorId, setDoctorId] = useState(schedule ? String(schedule.doctorId) : "");
  const [dayOfWeek, setDayOfWeek] = useState(schedule?.dayOfWeek ?? "");
  const [officeId, setOfficeId] = useState(schedule ? String(schedule.officeId) : "");
  const [specialtyId, setSpecialtyId] = useState(schedule ? String(schedule.specialtyId) : "");
  const [shiftTypeId, setShiftTypeId] = useState(schedule ? String(schedule.shiftTypeId) : "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  // blocks a second submit before the disabled button re-renders
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      try {
        const [doctorList, officeList, shiftList] = await Promise.all([getDoctorOptions(), getOffices(), getShiftTypes()]);
        if (active) {
          setDoctors(doctorList);
          setOffices(officeList);
          setShifts(shiftList);
        }
      } catch (err) {
        if (active) setLoadError(apiErrorMessage(err));
      } finally {
        if (active) setLoadingOptions(false);
      }
    }

    loadOptions();
    return () => {
      active = false;
    };
  }, []);

  // only active records can be used for an assignment
  const doctor = doctors.find((d) => String(d.doctorId) === doctorId);
  const specialtyOptions = doctor?.specialties.filter((s) => s.isActive) ?? [];
  const officeOptions = offices.filter((o) => o.isActive);
  const shiftOptions = shifts.filter((s) => s.isActive);

  // keep the specialty only if the newly chosen doctor practices it
  function chooseDoctor(value: string) {
    setDoctorId(value);
    const choices = doctors.find((d) => String(d.doctorId) === value)?.specialties.filter((s) => s.isActive) ?? [];
    if (!choices.some((s) => String(s.specialtyId) === specialtyId)) {
      setSpecialtyId(choices.length === 1 ? String(choices[0].specialtyId) : "");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting.current) return;

    submitting.current = true;
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        doctorId: Number(doctorId),
        dayOfWeek,
        officeId: Number(officeId),
        specialtyId: Number(specialtyId),
        shiftTypeId: Number(shiftTypeId),
      });
    } catch (err) {
      setError(apiErrorMessage(err));
      setSaving(false);
      submitting.current = false;
    }
  }

  if (loadingOptions) return <p className="text-sm text-slate-600">Loading form...</p>;
  if (loadError) return <p role="alert" className={ERROR_BOX}>The form could not be loaded. {loadError}</p>;

  const readOnly = (label: string, value: string) => (
    <div>
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <p className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700">{value}</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title={schedule ? "Change Assignment" : "Schedule Details"}>
        {shiftOptions.length === 0 && (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            No active shifts exist yet.{" "}
            <Link to="/admin/schedules/shifts" className="font-medium underline">
              Add a shift
            </Link>{" "}
            before assigning schedules.
          </p>
        )}
        {schedule && !doctor && (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            This doctor is inactive, so their schedule can't be reassigned until they're activated again.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {schedule ? (
            readOnly("Doctor", `${schedule.doctorFirstName} ${schedule.doctorLastName} (${formatId(schedule.doctorId)})`)
          ) : (
            <SelectField label="Doctor" required value={doctorId} onChange={(e) => chooseDoctor(e.target.value)}>
              <option value="">Select a doctor</option>
              {doctors.map((d) => (
                <option key={d.doctorId} value={d.doctorId}>
                  {d.firstName} {d.lastName} ({formatId(d.doctorId)})
                </option>
              ))}
            </SelectField>
          )}

          {schedule ? (
            readOnly("Day of Week", schedule.dayOfWeek)
          ) : (
            <SelectField label="Day of Week" required value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
              <option value="">Select a day</option>
              {WEEKDAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </SelectField>
          )}

          <SelectField label="Office" required value={officeId} onChange={(e) => setOfficeId(e.target.value)}>
            <option value="">Select an office</option>
            {officeOptions.map((o) => (
              <option key={o.officeId} value={o.officeId}>
                {o.name} ({o.city}, {o.state})
              </option>
            ))}
          </SelectField>

          <SelectField label="Specialty" required value={specialtyId} onChange={(e) => setSpecialtyId(e.target.value)} disabled={!doctor}>
            <option value="">{doctor ? "Select a specialty" : "Select a doctor first"}</option>
            {specialtyOptions.map((s) => (
              <option key={s.specialtyId} value={s.specialtyId}>{s.name}</option>
            ))}
          </SelectField>

          <SelectField label="Shift" required value={shiftTypeId} onChange={(e) => setShiftTypeId(e.target.value)}>
            <option value="">Select a shift</option>
            {shiftOptions.map((s) => (
              <option key={s.shiftTypeId} value={s.shiftTypeId}>
                {s.name} ({s.startTime}–{s.endTime})
              </option>
            ))}
          </SelectField>
        </div>
        {doctor && specialtyOptions.length === 0 && (
          <p className="mt-3 text-sm text-slate-500">This doctor has no active specialties. Add one on their employee page first.</p>
        )}
      </Section>

      {error && <p role="alert" className={ERROR_BOX}>{error}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        <Link to={cancelTo} className={ADMIN_SECONDARY_BUTTON}>
          {schedule ? "Back" : "Cancel"}
        </Link>
        <button type="submit" disabled={saving} className={ADMIN_PRIMARY_BUTTON}>
          {saving ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

// activate or deactivate a weekly schedule
function ScheduleStatus({ schedule, onChange }: { schedule: Schedule; onChange: (updated: Schedule) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // blocks a second request before the disabled buttons re-render
  const busy = useRef(false);

  async function changeStatus(isActive: boolean) {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await setScheduleStatus(schedule.doctorId, schedule.dayOfWeek, isActive);
      setConfirming(false);
      onChange(updated);
      setSuccess(isActive ? "Schedule activated." : "Schedule deactivated.");
    } catch (err) {
      setConfirming(false);
      setError(apiErrorMessage(err));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return (
    <Section title="Schedule Status">
      {success && <p role="status" className={`mb-2 ${SUCCESS_BOX}`}>{success}</p>}
      {error && <p role="alert" className={`mb-2 ${ERROR_BOX}`}>{error}</p>}

      <StatusRow
        label="Status"
        status={<ActiveBadge isActive={schedule.isActive} />}
        note={schedule.isActive ? "The doctor works this assignment every week." : "Inactive schedules are kept for history and can be reactivated."}
        showActions={!confirming}
      >
        {schedule.isActive ? (
          <button
            type="button"
            onClick={() => {
              setConfirming(true);
              setError("");
              setSuccess("");
            }}
            disabled={saving}
            className={ADMIN_DANGER_BUTTON}
          >
            Deactivate Schedule
          </button>
        ) : (
          <button type="button" onClick={() => changeStatus(true)} disabled={saving} className={ADMIN_PRIMARY_BUTTON}>
            Activate Schedule
          </button>
        )}
      </StatusRow>

      {confirming && (
        <ConfirmPanel
          text={`Deactivate ${schedule.doctorFirstName} ${schedule.doctorLastName}'s ${schedule.dayOfWeek} schedule? The record is kept, and booked appointments are not changed.`}
          confirmLabel="Deactivate Schedule"
          saving={saving}
          onConfirm={() => changeStatus(false)}
          onCancel={() => setConfirming(false)}
        />
      )}
    </Section>
  );
}

export function AdminScheduleCreate() {
  const navigate = useNavigate();

  async function handleCreate(input: ScheduleAssignment & { doctorId: number; dayOfWeek: string }) {
    const created = await createSchedule(input);
    navigate(`/admin/schedules/${created.doctorId}/${created.dayOfWeek}/edit`, { state: { message: "Schedule created." } });
  }

  return (
    <AdminPage
      title="Add Schedule"
      description="Assign a doctor to one office, specialty, and shift for a day of the week."
      back={{ to: "/admin/schedules", label: "Back to Schedules" }}
    >
      <ScheduleForm cancelTo="/admin/schedules" submitLabel="Create Schedule" onSubmit={handleCreate} />
    </AdminPage>
  );
}

export function AdminScheduleEdit() {
  const params = useParams();
  const doctorId = parseRouteId(params.doctorId);
  const dayOfWeek = params.dayOfWeek && WEEKDAYS.includes(params.dayOfWeek) ? params.dayOfWeek : null;
  // set by the add form after saving
  const [message, setMessage] = useState((useLocation().state as { message?: string } | null)?.message ?? "");
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // remounts the form with the saved values after each save
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadSchedule() {
      setLoading(true);
      setError("");
      setSchedule(null);

      if (doctorId === null || dayOfWeek === null) {
        setError("This schedule link is not valid.");
        setLoading(false);
        return;
      }

      try {
        const data = await getSchedule(doctorId, dayOfWeek);
        if (active) setSchedule(data);
      } catch (err) {
        if (active) setError(apiErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSchedule();
    return () => {
      active = false;
    };
  }, [doctorId, dayOfWeek]);

  async function handleSave(input: ScheduleAssignment) {
    if (!schedule) return;
    const updated = await updateSchedule(schedule.doctorId, schedule.dayOfWeek, input);
    setSchedule(updated);
    setFormKey((k) => k + 1);
    setMessage("Changes saved.");
  }

  function handleStatusChange(updated: Schedule) {
    setSchedule(updated);
    setMessage("");
  }

  return (
    <AdminPage
      title={schedule ? `${schedule.doctorFirstName} ${schedule.doctorLastName} · ${schedule.dayOfWeek}` : "Schedule"}
      description={schedule ? `Staff ID ${formatId(schedule.doctorId)} · Weekly schedule` : undefined}
      back={{ to: "/admin/schedules", label: "Back to Schedules" }}
    >
      {message && schedule && <p role="status" className={SUCCESS_BOX}>{message}</p>}
      {loading && <p className="text-sm text-slate-600">Loading schedule...</p>}
      {error && <p role="alert" className={ERROR_BOX}>{error}</p>}

      {schedule && (
        <>
          <Section title="Current Assignment">
            <InfoGrid>
              <InfoItem label="Office" value={schedule.officeName} />
              <InfoItem label="Specialty" value={schedule.specialtyName} />
              <InfoItem label="Shift" value={`${schedule.shiftName} (${schedule.startTime}–${schedule.endTime})`} />
              <InfoItem label="Status" value={<ActiveBadge isActive={schedule.isActive} />} />
            </InfoGrid>
          </Section>

          <ScheduleForm key={formKey} schedule={schedule} cancelTo="/admin/schedules" submitLabel="Save Changes" onSubmit={handleSave} />

          <ScheduleStatus schedule={schedule} onChange={handleStatusChange} />
        </>
      )}
    </AdminPage>
  );
}
