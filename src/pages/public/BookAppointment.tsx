import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode, Ref } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { EmployeeBookingNotice } from "../../components/public/EmployeeBookingNotice";
import { OfficeAddress } from "../../components/public/OfficeAddress";
import { TimeSlotPicker } from "../../components/public/TimeSlotPicker";
import { CONTAINER, EYEBROW, FIELD_INPUT, FIELD_LABEL, FOCUS, PRIMARY_BUTTON, SECONDARY_BUTTON, TEXT_LINK } from "../../components/public/shared";
import { useAuth } from "../../context/AuthContext";
import { getPatientAvailability, getPublicAvailability, isSameSlot } from "../../services/bookingApi";
import type { AvailableSlot, SlotChoice } from "../../services/bookingApi";
import { getPublicDoctors, getPublicOffices, getPublicSpecialties } from "../../services/publicApi";
import type { PublicDoctor, PublicOffice, PublicSpecialty } from "../../services/publicApi";
import { loginForBooking } from "../../utils/bookingLinks";
import { addDays, clinicToday, formatDate, formatTime, isDate } from "../../utils/clinicTime";
import { specialtyDescription } from "../../utils/specialties";

type PatientType = "new" | "returning";

interface Directory {
  specialties: PublicSpecialty[];
  doctors: PublicDoctor[];
  offices: PublicOffice[];
}

// a response tagged with the search it answers, so a response to an older search counts as still loading
interface Loaded<T> {
  key: string;
  data: T | null;
  failed: boolean;
}

// weeks of open times a visitor can browse, counting this one
const WEEKS_AHEAD = 8;

// the chosen day and time, cleared whenever the care choices change
const CLEAR_TIME = { day: null, date: null, slot: null, slotDoctor: null };

// every search param that holds a care or time choice
const CHOICE_KEYS = ["specialty", "doctor", "office", "week", "day", "date", "slot", "slotDoctor"];

const PATIENT_TYPES: { value: PatientType; title: string; text: string }[] = [
  { value: "new", title: "New patient", text: "You haven't received care at any of our clinic locations before." },
  { value: "returning", title: "Returning patient", text: "You've had an appointment with one of our doctors before." },
];

const SELECT = `${FIELD_INPUT} disabled:bg-slate-50 disabled:text-slate-400`;

const doctorName = (doctor: { firstName: string; lastName: string }) => `Dr. ${doctor.firstName} ${doctor.lastName}`;
const idParam = (id: number | undefined) => (id ? String(id) : null);

// the care choices that fit together, ignoring IDs that don't match a current option
function resolveCare(directory: Directory, patientType: PatientType | null, wanted: { specialty: string | null; doctor: string | null; office: string | null }) {
  const specialties = directory.specialties.filter((s) => s.doctorCount > 0);
  // new patients can't have a referral from our doctors yet
  const specialty = specialties.find((s) => String(s.specialtyId) === wanted.specialty && !(patientType === "new" && s.requiresReferral));
  // doctors who practice the specialty and are scheduled at one or more locations
  const specialtyDoctors = specialty
    ? directory.doctors.filter((d) => d.offices.length > 0 && d.specialties.some((s) => s.specialtyId === specialty.specialtyId))
    : [];
  const doctor = specialtyDoctors.find((d) => String(d.doctorId) === wanted.doctor);
  const officeIds = new Set((doctor ? [doctor] : specialtyDoctors).flatMap((d) => d.offices.map((o) => o.officeId)));
  const offices = directory.offices.filter((o) => officeIds.has(o.officeId));
  const office = offices.find((o) => String(o.officeId) === wanted.office);
  const doctors = office ? specialtyDoctors.filter((d) => d.offices.some((o) => o.officeId === office.officeId)) : specialtyDoctors;
  // a doctor chosen before any specialty, like from a doctor's profile
  const requestedDoctor = specialty ? undefined : directory.doctors.find((d) => d.offices.length > 0 && String(d.doctorId) === wanted.doctor);
  return { specialties, specialty, doctors, doctor, offices, office, requestedDoctor };
}

// the chosen time in the URL, if it's well formed
function readChoice(params: URLSearchParams): SlotChoice | null {
  const date = params.get("date");
  const doctorId = Number(params.get("slotDoctor"));
  const timeSlotId = Number(params.get("slot"));
  if (!isDate(date) || !Number.isInteger(doctorId) || doctorId < 1 || !Number.isInteger(timeSlotId) || timeSlotId < 1) return null;
  return { date, doctorId, timeSlotId };
}

export function BookAppointmentPage() {
  const { user, role, loading: authLoading } = useAuth();
  const [params, setParams] = useSearchParams();
  const [today] = useState(clinicToday);
  const [directory, setDirectory] = useState<Directory | null>(null);
  const [directoryFailed, setDirectoryFailed] = useState(false);
  const [directoryAttempt, setDirectoryAttempt] = useState(0);
  const [week, setWeek] = useState<Loaded<AvailableSlot[]> | null>(null);
  const [weekAttempt, setWeekAttempt] = useState(0);
  const [picked, setPicked] = useState<Loaded<AvailableSlot> | null>(null);
  const navigate = useNavigate();
  const careHeading = useRef<HTMLHeadingElement>(null);
  const focusCare = useRef(false);
  // the search params of the steps this page showed last, kept while the page stays open
  const lastSteps = useRef<string | null>(null);

  const isEmployee = role !== null && role !== "patient";
  const signedIn = role === "patient";
  const patientParam = params.get("patient");
  // signed in patients already have an account, so they skip the new or returning question
  const patientType: PatientType | null = signedIn ? "returning" : patientParam === "new" || patientParam === "returning" ? patientParam : null;
  // step=patient shows the question again with the earlier answer still selected
  const showQuestion = !signedIn && (!patientType || params.get("step") === "patient");

  useEffect(() => {
    let active = true;

    async function loadDirectory() {
      try {
        const [specialties, doctors, offices] = await Promise.all([getPublicSpecialties(), getPublicDoctors(), getPublicOffices()]);
        if (active) setDirectory({ specialties, doctors, offices });
      } catch {
        if (active) setDirectoryFailed(true);
      }
    }

    loadDirectory();
    return () => {
      active = false;
    };
  }, [directoryAttempt]);

  // move focus to the first step after the patient question is answered
  useEffect(() => {
    if (!showQuestion && focusCare.current) {
      focusCare.current = false;
      careHeading.current?.focus();
    }
  }, [showQuestion]);

  // Back from the steps lands on the question without the choices made since,
  // so they're copied into its URL and survive a reload there
  useEffect(() => {
    if (!showQuestion) {
      if (patientType) lastSteps.current = params.toString();
      return;
    }
    if (!lastSteps.current) return;
    const previous = new URLSearchParams(lastSteps.current);
    if (CHOICE_KEYS.every((key) => previous.get(key) === params.get(key))) return;
    const next = new URLSearchParams(params);
    for (const key of CHOICE_KEYS) {
      const value = previous.get(key);
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  }, [showQuestion, patientType, params, setParams]);

  const wantedCare = { specialty: params.get("specialty"), doctor: params.get("doctor"), office: params.get("office") };
  const care = directory ? resolveCare(directory, patientType, wantedCare) : null;
  const specialtyId = care?.specialty?.specialtyId;
  const doctorId = care?.doctor?.doctorId;
  const officeId = care?.office?.officeId;
  const preferredDoctor = care?.doctor ?? care?.requestedDoctor;

  // seven days at a time, starting today in clinic time
  const lastWeek = addDays(today, (WEEKS_AHEAD - 1) * 7);
  const weekParam = params.get("week");
  const weekStart = isDate(weekParam) && weekParam > today && weekParam <= lastWeek ? weekParam : today;
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const searching = !authLoading && !isEmployee && !showQuestion && patientType !== null && specialtyId !== undefined;
  const weekKey = searching ? [signedIn, specialtyId, doctorId, officeId, weekStart, weekAttempt].join("|") : null;

  useEffect(() => {
    if (!weekKey || specialtyId === undefined) return;
    let active = true;
    const key = weekKey;
    // taken times come back too, so the picker can show them grayed out
    const search = { specialtyId, doctorId, officeId, date: weekStart, days: 7, includeTaken: true };

    async function loadWeek() {
      try {
        // signed in patients get the search that knows their own appointments and referrals
        const data = await (signedIn ? getPatientAvailability(search) : getPublicAvailability(search));
        if (active) setWeek({ key, data, failed: false });
      } catch {
        if (active) setWeek({ key, data: null, failed: true });
      }
    }

    loadWeek();
    return () => {
      active = false;
    };
  }, [weekKey, signedIn, specialtyId, doctorId, officeId, weekStart]);

  const current = week && week.key === weekKey ? week : null;
  // the backend fills in a referral only when the patient has an approved one for that doctor and date
  const needsReferral = signedIn && !!care?.specialty?.requiresReferral;
  const weekSlots = current?.data ? (needsReferral ? current.data.filter((s) => s.referralId) : current.data) : null;
  const referralMissing = needsReferral && !!current?.data?.length && weekSlots?.length === 0;

  // a chosen time only counts while it fits the care choices and the booking window
  const parsedChoice = readChoice(params);
  const choice =
    parsedChoice && searching && (!doctorId || parsedChoice.doctorId === doctorId) && parsedChoice.date >= today && parsedChoice.date <= addDays(lastWeek, 6)
      ? parsedChoice
      : null;
  const choiceInWeek = !!choice && choice.date >= weekStart && choice.date <= days[6];
  const choiceKey = choice && !choiceInWeek ? [signedIn, specialtyId, officeId, choice.date, choice.doctorId, choice.timeSlotId].join("|") : null;
  const choiceDate = choice?.date;
  const choiceDoctor = choice?.doctorId;
  const choiceSlot = choice?.timeSlotId;

  // a time chosen in another week is looked up on its own day
  useEffect(() => {
    if (!choiceKey || specialtyId === undefined || !choiceDate || !choiceDoctor || !choiceSlot) return;
    let active = true;
    const key = choiceKey;
    const wanted = { date: choiceDate, doctorId: choiceDoctor, timeSlotId: choiceSlot };
    const search = { specialtyId, doctorId: choiceDoctor, officeId, date: choiceDate, days: 1 };

    async function loadChoice() {
      try {
        const data = await (signedIn ? getPatientAvailability(search) : getPublicAvailability(search));
        const slot = data.find((s) => isSameSlot(s, wanted) && (!needsReferral || s.referralId)) ?? null;
        if (active) setPicked({ key, data: slot, failed: false });
      } catch {
        if (active) setPicked({ key, data: null, failed: true });
      }
    }

    loadChoice();
    return () => {
      active = false;
    };
  }, [choiceKey, signedIn, specialtyId, officeId, choiceDate, choiceDoctor, choiceSlot, needsReferral]);

  // undefined while the chosen time is still being checked, null when it's no longer open
  let selected: AvailableSlot | null | undefined = null;
  let choiceFailed = false;
  if (choice && choiceInWeek) {
    selected = weekSlots ? (weekSlots.find((s) => isSameSlot(s, choice) && s.available !== false) ?? null) : undefined;
  } else if (choice) {
    const lookup = picked?.key === choiceKey ? picked : null;
    choiceFailed = !!lookup?.failed;
    selected = lookup && !lookup.failed ? lookup.data : undefined;
  }

  // the day in the URL, then the chosen time's day, then the first day with open times
  const hasTimes = (date: string | null | undefined) => !!date && !!weekSlots?.some((s) => s.date === date);
  const viewedDay = [params.get("day"), choiceInWeek ? choiceDate : null].find(hasTimes) ?? weekSlots?.find((s) => s.available !== false)?.date ?? weekSlots?.[0]?.date ?? null;

  function update(changes: Record<string, string | null>, push = false) {
    setParams(
      (currentParams) => {
        const next = new URLSearchParams(currentParams);
        for (const [name, value] of Object.entries(changes)) {
          if (value) next.set(name, value);
          else next.delete(name);
        }
        return next;
      },
      { replace: !push }
    );
  }

  // the answer is saved right away, so Back and reload show the question with it still selected
  function selectPatientType(type: PatientType) {
    update({ patient: type, step: "patient" });
  }

  function continueFromQuestion(type: PatientType) {
    const next = new URLSearchParams(params);
    next.delete("step");
    next.set("patient", type);
    // only choices that still fit are kept, so switching to new patient drops a referral specialty
    // along with everything that depended on it
    if (directory) {
      const care = resolveCare(directory, type, { specialty: next.get("specialty"), doctor: next.get("doctor"), office: next.get("office") });
      const specialty = idParam(care.specialty?.specialtyId);
      if (specialty !== next.get("specialty")) {
        for (const key of ["specialty", "doctor", "office", ...Object.keys(CLEAR_TIME)]) next.delete(key);
      } else {
        const resolved = { doctor: idParam((care.doctor ?? care.requestedDoctor)?.doctorId), office: idParam(care.office?.officeId) };
        for (const [key, value] of Object.entries(resolved)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
      }
    }
    if (!readChoice(next)) for (const key of ["date", "slot", "slotDoctor"]) next.delete(key);
    focusCare.current = true;
    setParams(next);
  }

  // signed in patients go straight to review, everyone else signs in or creates an account first
  function continueToReview() {
    const review = new URLSearchParams(params);
    review.delete("step");
    const path = `/book/review?${review}`;
    // the time travels in the review link and leaves this history entry,
    // so Back after booking returns here without a time that's now taken
    update({ date: null, slot: null, slotDoctor: null });
    navigate(signedIn ? path : loginForBooking(path, patientType === "new"));
  }

  // keeps the other care choices when they still fit, and clears the chosen time
  function changeCare(field: "specialty" | "doctor" | "office", value: string) {
    if (!directory) return;
    const next = resolveCare(directory, patientType, { ...wantedCare, [field]: value });
    update({
      specialty: idParam(next.specialty?.specialtyId),
      doctor: idParam(next.doctor?.doctorId),
      office: idParam(next.office?.officeId),
      ...CLEAR_TIME,
    });
  }

  function changeWeek(weeks: number) {
    const next = addDays(weekStart, weeks * 7);
    update({ week: next === today ? null : next, day: null });
  }

  function selectSlot(slot: AvailableSlot) {
    update({ day: slot.date, date: slot.date, slot: String(slot.timeSlotId), slotDoctor: String(slot.doctorId) });
  }

  function retryDirectory() {
    setDirectoryFailed(false);
    setDirectoryAttempt((count) => count + 1);
  }

  let weekMessage: ReactNode;
  if (current?.failed) {
    weekMessage = (
      <div role="alert">
        <p className="font-semibold text-navy">We couldn't load open times.</p>
        <p className="mt-1 text-slate-600">Please check your connection and try again.</p>
        <button type="button" onClick={() => setWeekAttempt((count) => count + 1)} className={`${SECONDARY_BUTTON} mt-4`}>
          Try again
        </button>
      </div>
    );
  } else if (referralMissing) {
    weekMessage = (
      <Notice title="No referral found for these times">
        This week's open {care?.specialty?.name} times are with doctors you don't have an approved referral to. Your clinic
        office can help if you think you should have one.
      </Notice>
    );
  } else if (weekSlots && !weekSlots.some((s) => s.available !== false)) {
    // says what was searched without claiming a doctor never offers this care
    const searched = care?.doctor
      ? ` with ${doctorName(care.doctor)}${care.office ? ` at ${care.office.name}` : ""}`
      : care?.office
        ? ` at ${care.office.name}`
        : "";
    weekMessage = (
      <Notice title="No open times this week">
        No open {care?.specialty?.name} appointments{searched} were found this week.{" "}
        {weekStart === lastWeek
          ? "Online booking shows times up to eight weeks ahead."
          : care?.doctor || care?.office
            ? "Try another week, or choose any doctor or location to see more times."
            : "Try the next week."}
      </Notice>
    );
  }

  return (
    <>
      <section className={`${CONTAINER} pt-10 sm:pt-14`}>
        <h1 className="font-heading text-4xl font-semibold text-navy sm:text-5xl">Book an Appointment</h1>
        {!isEmployee && (
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-600">Choose the care you need and an open time with one of our doctors.</p>
        )}
      </section>

      {authLoading ? (
        <p className={`${CONTAINER} pt-10 pb-20 text-slate-600`}>Loading...</p>
      ) : isEmployee ? (
        <EmployeeBookingNotice />
      ) : showQuestion || !patientType ? (
        <PatientTypeStep selected={patientType} onSelect={selectPatientType} onContinue={continueFromQuestion} />
      ) : (
        <div className={`${CONTAINER} grid gap-12 pt-10 pb-16 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] lg:gap-16 lg:pb-20`}>
          <div className="space-y-14">
            <section aria-labelledby="care-heading">
              <StepHeading id="care-heading" step={1} ref={careHeading}>
                Choose care
              </StepHeading>

              {!care ? (
                directoryFailed ? (
                  <div role="alert" className="mt-6">
                    <p className="font-semibold text-navy">We couldn't load our care options.</p>
                    <p className="mt-1 text-slate-600">Please check your connection and try again.</p>
                    <button type="button" onClick={retryDirectory} className={`${SECONDARY_BUTTON} mt-4`}>
                      Try again
                    </button>
                  </div>
                ) : (
                  <p className="mt-6 text-slate-600">Loading care options...</p>
                )
              ) : care.specialties.length === 0 ? (
                <p className="mt-6 text-slate-600">Online booking isn't available right now. Please contact your clinic office to schedule a visit.</p>
              ) : (
                <div className="mt-6 space-y-6">
                  <div>
                    {/* as wide as the doctor field below it */}
                    <label className="block sm:w-[calc(50%-0.75rem)]">
                      <span className={FIELD_LABEL}>Specialty</span>
                      <select value={idParam(specialtyId) ?? ""} onChange={(e) => changeCare("specialty", e.target.value)} className={SELECT}>
                        <option value="">Choose a specialty</option>
                        <SpecialtyGroup label="No referral needed" specialties={care.specialties.filter((s) => !s.requiresReferral)} />
                        <SpecialtyGroup
                          label="Referral required"
                          specialties={care.specialties.filter((s) => s.requiresReferral)}
                          disabled={patientType === "new"}
                        />
                      </select>
                    </label>
                    <SpecialtyNotes
                      specialty={care.specialty}
                      specialties={care.specialties}
                      requestedDoctor={care.requestedDoctor}
                      patientType={patientType}
                      signedIn={signedIn}
                    />
                  </div>

                  <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                    <label>
                      <span className={FIELD_LABEL}>Doctor</span>
                      <select value={idParam(doctorId) ?? ""} onChange={(e) => changeCare("doctor", e.target.value)} disabled={!care.specialty} className={SELECT}>
                        <option value="">{care.requestedDoctor ? doctorName(care.requestedDoctor) : "Any available doctor"}</option>
                        {care.doctors.map((d) => (
                          <option key={d.doctorId} value={d.doctorId}>
                            {doctorName(d)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span className={FIELD_LABEL}>Location</span>
                      <select value={idParam(officeId) ?? ""} onChange={(e) => changeCare("office", e.target.value)} disabled={!care.specialty} className={SELECT}>
                        <option value="">Any location</option>
                        {care.offices.map((o) => (
                          <option key={o.officeId} value={o.officeId}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              )}
            </section>

            <section aria-labelledby="time-heading">
              <StepHeading id="time-heading" step={2}>
                Choose a date and time
              </StepHeading>

              {!care?.specialty ? (
                <p className="mt-6 text-slate-600">Choose a specialty to see open times.</p>
              ) : (
                <div className="mt-6">
                  {choice && selected === null && (
                    <p role="status" className="mb-5 font-semibold text-red-700">
                      The time you picked is no longer available. Please choose another time.
                    </p>
                  )}
                  <TimeSlotPicker
                    days={days}
                    slots={current && !current.failed ? weekSlots : null}
                    viewedDay={viewedDay}
                    onViewDay={(date) => update({ day: date })}
                    selected={choice}
                    onSelect={selectSlot}
                    onPreviousWeek={weekStart > today ? () => changeWeek(-1) : undefined}
                    onNextWeek={weekStart < lastWeek ? () => changeWeek(1) : undefined}
                    message={weekMessage}
                  />
                </div>
              )}
            </section>
          </div>

          <aside aria-labelledby="summary-heading" className="lg:sticky lg:top-28 lg:self-start">
            <div className="border-t-2 border-teal-600 pt-5">
              <h2 id="summary-heading" className="text-lg font-semibold text-navy">
                Your appointment
              </h2>
              <dl className="mt-3 divide-y divide-slate-200 border-b border-slate-200">
                <SummaryRow label="Patient">
                  {signedIn && user ? (
                    `Signed in as ${user.firstName} ${user.lastName}`
                  ) : (
                    <span className="flex flex-wrap items-baseline justify-between gap-x-4">
                      {patientType === "new" ? "New patient" : "Returning patient"}
                      <button type="button" onClick={() => update({ step: "patient" }, true)} className={`${TEXT_LINK} text-sm`}>
                        Change
                      </button>
                    </span>
                  )}
                </SummaryRow>
                <SummaryRow label="Care">{care?.specialty?.name ?? "Not chosen yet"}</SummaryRow>
                <SummaryRow label="Doctor">
                  {selected ? `Dr. ${selected.doctorName}` : preferredDoctor ? doctorName(preferredDoctor) : "Any available doctor"}
                </SummaryRow>
                <SummaryRow label="Location">
                  {selected ? <SelectedOffice slot={selected} offices={directory?.offices ?? []} /> : (care?.office?.name ?? "Any location")}
                </SummaryRow>
                <SummaryRow label="Date and time">
                  {selected ? (
                    <>
                      <span className="block">{formatDate(selected.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
                      <span className="block">
                        {formatTime(selected.startTime)} to {formatTime(selected.endTime)} Central Time
                      </span>
                    </>
                  ) : choice && selected === undefined ? (
                    choiceFailed ? "We couldn't load the time you picked." : "Loading..."
                  ) : (
                    "Not chosen yet"
                  )}
                </SummaryRow>
              </dl>
              {selected && (
                <>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">
                    {signedIn
                      ? "Next, you'll review the details before the appointment is booked."
                      : patientType === "new"
                        ? "Next, you'll create your patient account and review the details before the appointment is booked."
                        : "Next, you'll sign in and review the details before the appointment is booked."}
                  </p>
                  <button type="button" onClick={continueToReview} className={`${PRIMARY_BUTTON} mt-5 w-full`}>
                    Continue
                  </button>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function PatientTypeStep({
  selected,
  onSelect,
  onContinue,
}: {
  selected: PatientType | null;
  onSelect: (type: PatientType) => void;
  onContinue: (type: PatientType) => void;
}) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (selected) onContinue(selected);
  }

  return (
    <section className={`${CONTAINER} pt-8 pb-16 lg:pb-20`}>
      <form onSubmit={handleSubmit} className="max-w-2xl border-t border-slate-200 pt-8">
        <h2 id="patient-type-heading" className="font-heading text-3xl font-semibold text-navy">
          Are you a new or returning patient?
        </h2>
        <div role="radiogroup" aria-labelledby="patient-type-heading" className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
          {PATIENT_TYPES.map((option) => (
            <label key={option.value} className="flex cursor-pointer items-start gap-4 py-4">
              <input
                type="radio"
                name="patient-type"
                value={option.value}
                checked={selected === option.value}
                onChange={() => onSelect(option.value)}
                className={`mt-1.5 h-4 w-4 shrink-0 accent-navy ${FOCUS}`}
              />
              <span>
                <span className="block text-lg font-semibold text-navy">{option.title}</span>
                <span className="mt-1 block leading-relaxed text-slate-600">{option.text}</span>
              </span>
            </label>
          ))}
        </div>
        {/* the button sits beside the note on wider screens so the whole question fits without scrolling */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          <button type="submit" disabled={!selected} className={`${PRIMARY_BUTTON} self-start disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto`}>
            Continue
          </button>
          <p className="text-sm leading-relaxed text-slate-600">
            Visited before but don't have an online account?{" "}
            <Link to="/contact" className={`rounded font-semibold text-teal-700 hover:text-navy hover:underline ${FOCUS}`}>
              Contact your clinic office
            </Link>{" "}
            for help.
          </p>
        </div>
      </form>
    </section>
  );
}

function StepHeading({ id, step, children, ref }: { id: string; step: number; children: string; ref?: Ref<HTMLHeadingElement> }) {
  return (
    <div className="border-t border-slate-200 pt-8">
      <p className={EYEBROW}>Step {step} of 3</p>
      <h2 id={id} ref={ref} tabIndex={-1} className="mt-2 font-heading text-3xl font-semibold text-navy focus:outline-none">
        {children}
      </h2>
    </div>
  );
}

function SpecialtyGroup({ label, specialties, disabled = false }: { label: string; specialties: PublicSpecialty[]; disabled?: boolean }) {
  if (specialties.length === 0) return null;
  return (
    <optgroup label={label}>
      {specialties.map((s) => (
        <option key={s.specialtyId} value={s.specialtyId} disabled={disabled}>
          {s.name}
        </option>
      ))}
    </optgroup>
  );
}

function SpecialtyNotes({
  specialty,
  specialties,
  requestedDoctor,
  patientType,
  signedIn,
}: {
  specialty: PublicSpecialty | undefined;
  specialties: PublicSpecialty[];
  requestedDoctor: PublicDoctor | undefined;
  patientType: PatientType;
  signedIn: boolean;
}) {
  // the requested doctor's specialties this patient can book, so they can pick one
  const doctorSpecialties = requestedDoctor
    ? specialties
        .filter((s) => requestedDoctor.specialties.some((d) => d.specialtyId === s.specialtyId) && !(patientType === "new" && s.requiresReferral))
        .map((s) => s.name)
    : [];

  return (
    <div className="mt-3 max-w-2xl space-y-2 leading-relaxed text-slate-600">
      {requestedDoctor && doctorSpecialties.length > 0 && (
        <p>
          {doctorName(requestedDoctor)} practices {new Intl.ListFormat("en", { type: "conjunction" }).format(doctorSpecialties)}. Choose a
          specialty to see their open times.
        </p>
      )}
      {specialty && <p>{specialtyDescription(specialty.name)}</p>}
      {specialty?.requiresReferral && (
        <p className="text-sm">
          <span className="font-semibold text-navy">Referral required.</span>{" "}
          {signedIn
            ? `${specialty.name} needs an approved referral, so only times with a doctor you've been referred to are shown.`
            : `${specialty.name} needs an approved referral to the doctor you'll see. We'll check your referral after you sign in.`}
        </p>
      )}
      {patientType === "new" && specialties.some((s) => s.requiresReferral) && (
        <p className="text-sm">
          Specialties that require a referral can be booked after one of our doctors refers you, so new patients start with a
          specialty that doesn't need one.
        </p>
      )}
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="py-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-slate-800">{children}</dd>
    </div>
  );
}

function SelectedOffice({ slot, offices }: { slot: AvailableSlot; offices: PublicOffice[] }) {
  const office = offices.find((o) => o.officeId === slot.officeId);
  return (
    <>
      <span className="block">{slot.officeName}</span>
      {office && <OfficeAddress office={office} className="text-sm text-slate-600" />}
    </>
  );
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-slate-200 pb-6">
      <p className="font-semibold text-navy">{title}</p>
      <p className="mt-1 leading-relaxed text-slate-600">{children}</p>
    </div>
  );
}
