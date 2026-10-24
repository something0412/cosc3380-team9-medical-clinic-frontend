import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AppointmentDetails, DetailRow } from "../../components/public/AppointmentDetails";
import { EmployeeBookingNotice } from "../../components/public/EmployeeBookingNotice";
import { CONTAINER, EYEBROW, PRIMARY_BUTTON, SECONDARY_BUTTON, TEXT_LINK } from "../../components/public/shared";
import { useAuth } from "../../context/AuthContext";
import { bookAppointment, errorStatus, getPatientAvailability, isSameSlot } from "../../services/bookingApi";
import type { AvailableSlot } from "../../services/bookingApi";
import { getPublicOffice } from "../../services/publicApi";
import type { PublicOfficeDetails } from "../../services/publicApi";
import { loginForBooking } from "../../utils/bookingLinks";
import { clinicToday, hasStarted, isDate } from "../../utils/clinicTime";

// why a booking attempt didn't go through
type Problem = "taken" | "passed" | "referral" | "unclear" | "invalid" | "forbidden" | "network" | "server";

const PROBLEMS: Record<Problem, string> = {
  taken: "That time is no longer available. Someone may have just booked it, or it may overlap another appointment of yours.",
  passed: "That appointment time has already passed.",
  referral: "Your referral no longer covers this appointment. Your clinic office can help with your referral.",
  unclear: "We couldn't book that time. Please choose another available appointment.",
  invalid: "Some appointment details are missing or invalid. Please choose your appointment again.",
  forbidden: "This account can't book appointments online.",
  network: "We couldn't reach the server, so we can't tell whether the appointment was booked. Check My Appointments before trying again.",
  server: "Something went wrong on our side and the appointment wasn't booked. Please try again in a moment.",
};

// problems that mean this time can't be booked, so the patient picks another one
const FINAL_PROBLEMS: Problem[] = ["taken", "passed", "referral", "unclear", "invalid", "forbidden"];

// a positive whole number that fits the database's ID columns
function readId(value: string | null) {
  return value && /^[1-9]\d{0,9}$/.test(value) && Number(value) <= 2147483647 ? Number(value) : null;
}

// the chosen appointment from the URL, or null when something is missing or malformed
function readSelection(params: URLSearchParams) {
  const specialtyId = readId(params.get("specialty"));
  const doctorId = readId(params.get("slotDoctor"));
  const timeSlotId = readId(params.get("slot"));
  const date = params.get("date");
  if (!specialtyId || !doctorId || !timeSlotId || !isDate(date)) return null;
  return { specialtyId, doctorId, timeSlotId, date };
}

export function BookReviewPage() {
  const { user, role, loading: authLoading } = useAuth();
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [today] = useState(clinicToday);
  const [attempt, setAttempt] = useState(0);
  const [check, setCheck] = useState<{ key: string; slot: AvailableSlot | null; failed: boolean } | null>(null);
  const [office, setOffice] = useState<PublicOfficeDetails | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // blocks a second click before the disabled button has rendered
  const submittingRef = useRef(false);

  const signedIn = role === "patient";
  const selection = readSelection(params);
  const specialtyId = selection?.specialtyId;
  const doctorId = selection?.doctorId;
  const timeSlotId = selection?.timeSlotId;
  const date = selection?.date;
  const upcoming = !!date && date >= today;
  const checkKey = signedIn && selection && upcoming ? [specialtyId, doctorId, date, timeSlotId, attempt].join("|") : null;

  // nothing was held while the patient signed in, so ask again with their own session
  useEffect(() => {
    if (!checkKey || !specialtyId || !doctorId || !timeSlotId || !date) return;
    let active = true;
    const key = checkKey;
    const wanted = { date, doctorId, timeSlotId };
    const search = { specialtyId, doctorId, date, days: 1 };

    async function recheck() {
      try {
        const slots = await getPatientAvailability(search);
        if (active) setCheck({ key, slot: slots.find((s) => isSameSlot(s, wanted)) ?? null, failed: false });
      } catch {
        if (active) setCheck({ key, slot: null, failed: true });
      }
    }

    recheck();
    return () => {
      active = false;
    };
  }, [checkKey, specialtyId, doctorId, timeSlotId, date]);

  const current = check?.key === checkKey ? check : null;
  const slot = current?.slot ?? null;
  const officeId = slot?.officeId;

  // the office address is a nice extra, so a failure here just leaves it out
  useEffect(() => {
    if (!officeId) return;
    let active = true;
    getPublicOffice(String(officeId))
      .then((data) => {
        if (active) setOffice(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [officeId]);

  // the /book page with the same care choices, minus the time that didn't work out
  const chooseAgain = new URLSearchParams(params);
  for (const key of ["date", "slot", "slotDoctor"]) chooseAgain.delete(key);
  const chooseAgainPath = `/book?${chooseAgain}`;

  // after a refused booking, look at the time again so the message can say why
  async function explainConflict(booked: AvailableSlot): Promise<Problem> {
    if (hasStarted(booked.date, booked.startTime)) return "passed";
    try {
      const slots = await getPatientAvailability({ specialtyId: booked.specialtyId, doctorId: booked.doctorId, date: booked.date, days: 1 });
      const fresh = slots.find((s) => isSameSlot(s, booked));
      if (!fresh) return "taken";
      if (fresh.requiresReferral && !fresh.referralId) return "referral";
    } catch {
      // fall back to the general message
    }
    return "unclear";
  }

  // runs only when the patient presses Confirm
  async function confirm() {
    if (!slot || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setProblem(null);
    try {
      const appointment = await bookAppointment({
        doctorId: slot.doctorId,
        specialtyId: slot.specialtyId,
        date: slot.date,
        timeSlotId: slot.timeSlotId,
        ...(slot.referralId ? { referralId: slot.referralId } : {}),
      });
      // replace this page so Back doesn't land on a review of a time that's now booked
      navigate(`/book/confirmed/${appointment.appointmentId}`, { replace: true });
      return;
    } catch (err) {
      const status = errorStatus(err);
      // an expired session signs the patient out, and the check below sends them back through sign in
      if (status === 401) return;
      setProblem(
        status === 409 ? await explainConflict(slot) : status === 400 ? "invalid" : status === 403 ? "forbidden" : status === null ? "network" : "server"
      );
    }
    submittingRef.current = false;
    setSubmitting(false);
  }

  if (authLoading) {
    return (
      <Page>
        <p className="text-slate-600">Loading...</p>
      </Page>
    );
  }
  if (role && !signedIn) {
    return (
      <>
        <PageHeading />
        <EmployeeBookingNotice />
      </>
    );
  }
  if (!signedIn) return <Navigate to={loginForBooking(location.pathname + location.search)} replace />;

  if (!selection) {
    return (
      <Page>
        <Message title="This booking link is incomplete">Some appointment details are missing or invalid. Please choose your appointment again.</Message>
        <Link to="/book" className={`${PRIMARY_BUTTON} mt-6`}>
          Start a new booking
        </Link>
      </Page>
    );
  }

  if (!upcoming) {
    return (
      <Page>
        <Message title="That appointment time has passed">Please choose another time.</Message>
        <ChooseAgain to={chooseAgainPath} />
      </Page>
    );
  }

  if (!current) {
    return (
      <Page>
        <p className="text-slate-600">Checking that this time is still available...</p>
      </Page>
    );
  }

  if (current.failed) {
    return (
      <Page>
        <div role="alert">
          <Message title="We couldn't check this appointment">Please check your connection and try again.</Message>
        </div>
        <button type="button" onClick={() => setAttempt((count) => count + 1)} className={`${SECONDARY_BUTTON} mt-6`}>
          Try again
        </button>
      </Page>
    );
  }

  if (!slot) {
    return (
      <Page>
        <Message title="This time is no longer available">
          It may have just been booked, or it may overlap another appointment of yours. Your care choices are saved, so you can
          pick another time.
        </Message>
        <ChooseAgain to={chooseAgainPath} />
      </Page>
    );
  }

  if (slot.requiresReferral && !slot.referralId) {
    return (
      <Page>
        <Message title="This appointment needs a referral">
          We couldn't find an approved {slot.specialty} referral to Dr. {slot.doctorName} for this date. Referrals come from our
          doctors, and your clinic office can help if you think you should have one.
        </Message>
        <ChooseAgain to={chooseAgainPath} />
      </Page>
    );
  }

  const finalProblem = !!problem && FINAL_PROBLEMS.includes(problem);

  return (
    <Page lead="Check the details below. The appointment is booked when you confirm.">
      <div className="max-w-3xl">
        <AppointmentDetails
          specialty={slot.specialty}
          doctorName={slot.doctorName}
          officeName={slot.officeName}
          office={office?.officeId === slot.officeId ? office : null}
          date={slot.date}
          startTime={slot.startTime}
          endTime={slot.endTime}
        >
          {slot.requiresReferral && <DetailRow label="Referral">Required. Your approved referral will be used for this appointment.</DetailRow>}
          {user && <DetailRow label="Patient">{`${user.firstName} ${user.lastName}`}</DetailRow>}
        </AppointmentDetails>

        {problem && (
          <p role="alert" className="mt-6 font-semibold text-red-700">
            {PROBLEMS[problem]}
            {problem === "network" && (
              <>
                {" "}
                <Link to="/patient/appointments" className={`${TEXT_LINK} inline`}>
                  View My Appointments
                </Link>
              </>
            )}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          {finalProblem ? (
            <Link to={chooseAgainPath} className={PRIMARY_BUTTON}>
              Choose another time
            </Link>
          ) : (
            <>
              <button type="button" onClick={confirm} disabled={submitting} className={`${PRIMARY_BUTTON} disabled:cursor-not-allowed disabled:opacity-60`}>
                {submitting ? "Booking..." : "Confirm Appointment"}
              </button>
              <Link to={chooseAgainPath} className={`${TEXT_LINK} text-sm`}>
                Choose a different time
              </Link>
            </>
          )}
        </div>
      </div>
    </Page>
  );
}

function PageHeading({ lead }: { lead?: string }) {
  return (
    <section className={`${CONTAINER} pt-10 sm:pt-14`}>
      <p className={EYEBROW}>Step 3 of 3</p>
      <h1 className="mt-2 font-heading text-4xl font-semibold text-navy sm:text-5xl">Review your appointment</h1>
      {lead && <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-600">{lead}</p>}
    </section>
  );
}

function Page({ lead, children }: { lead?: string; children: ReactNode }) {
  return (
    <>
      <PageHeading lead={lead} />
      <div className={`${CONTAINER} pt-10 pb-16 lg:pb-20`}>{children}</div>
    </>
  );
}

function Message({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="max-w-2xl border-t border-slate-200 pt-8">
      <h2 className="font-heading text-3xl font-semibold text-navy">{title}</h2>
      <p className="mt-3 text-lg leading-relaxed text-slate-600">{children}</p>
    </div>
  );
}

function ChooseAgain({ to }: { to: string }) {
  return (
    <Link to={to} className={`${PRIMARY_BUTTON} mt-6`}>
      Choose another time
    </Link>
  );
}
