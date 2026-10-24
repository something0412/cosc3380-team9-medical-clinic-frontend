import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { AppointmentDetails, DetailRow } from "../../components/public/AppointmentDetails";
import { EmployeeBookingNotice } from "../../components/public/EmployeeBookingNotice";
import { CONTAINER, PRIMARY_BUTTON, SECONDARY_BUTTON, TEXT_LINK } from "../../components/public/shared";
import { useAuth } from "../../context/AuthContext";
import { errorStatus, getAppointment } from "../../services/bookingApi";
import type { BookedAppointment } from "../../services/bookingApi";
import { getPublicOffice } from "../../services/publicApi";
import type { PublicOfficeDetails } from "../../services/publicApi";
import { loginForBooking } from "../../utils/bookingLinks";

type Result = { id: string; status: "ready" | "missing" | "failed"; appointment: BookedAppointment | null };

export function BookConfirmationPage() {
  const { appointmentId = "" } = useParams();
  const { role, loading: authLoading } = useAuth();
  const location = useLocation();
  const [result, setResult] = useState<Result | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [office, setOffice] = useState<PublicOfficeDetails | null>(null);

  const signedIn = role === "patient";
  const validId = /^[1-9]\d{0,9}$/.test(appointmentId);

  // always loaded from the backend, which only returns the signed in patient's own appointments
  useEffect(() => {
    if (!signedIn || !validId) return;
    let active = true;

    async function loadAppointment() {
      try {
        const data = await getAppointment(appointmentId);
        if (active) setResult({ id: appointmentId, status: "ready", appointment: data });
      } catch (err) {
        const status = errorStatus(err);
        // another patient's appointment comes back as not found, and it's shown the same way here
        if (active && status !== 401) setResult({ id: appointmentId, status: status === 404 || status === 403 ? "missing" : "failed", appointment: null });
      }
    }

    loadAppointment();
    return () => {
      active = false;
    };
  }, [signedIn, validId, appointmentId, attempt]);

  const current = result?.id === appointmentId ? result : null;
  const appointment = current?.appointment ?? null;
  const officeId = appointment?.officeId;

  // the office address and phone are extras, so a failure here just leaves them out
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

  if (authLoading) {
    return (
      <Page title="Your appointment">
        <p className="text-slate-600">Loading...</p>
      </Page>
    );
  }
  if (role && !signedIn) {
    return (
      <>
        <section className={`${CONTAINER} pt-10 sm:pt-14`}>
          <h1 className="font-heading text-4xl font-semibold text-navy sm:text-5xl">Book an Appointment</h1>
        </section>
        <EmployeeBookingNotice />
      </>
    );
  }
  if (!signedIn) return <Navigate to={loginForBooking(location.pathname)} replace />;

  if (!validId || current?.status === "missing") {
    return (
      <Page title="We couldn't find that appointment">
        <p className="max-w-2xl text-lg leading-relaxed text-slate-600">
          It may belong to a different account, or the link may be incorrect. Your appointments are listed in the Patient Portal.
        </p>
        <Links />
      </Page>
    );
  }

  if (current?.status === "failed") {
    return (
      <Page title="We couldn't load your appointment">
        <p role="alert" className="max-w-2xl text-lg leading-relaxed text-slate-600">
          Please check your connection and try again.
        </p>
        <button type="button" onClick={() => setAttempt((count) => count + 1)} className={`${SECONDARY_BUTTON} mt-6`}>
          Try again
        </button>
      </Page>
    );
  }

  if (!appointment) {
    return (
      <Page title="Your appointment">
        <p className="text-slate-600">Loading your appointment...</p>
      </Page>
    );
  }

  const officeDetails = office?.officeId === appointment.officeId ? office : null;

  return (
    <Page title="Your appointment is booked" lead={`We've saved your appointment with Dr. ${appointment.doctorName}.`}>
      <div className="max-w-3xl">
        <AppointmentDetails
          specialty={appointment.specialty}
          doctorName={appointment.doctorName}
          officeName={appointment.officeName}
          office={officeDetails}
          date={appointment.date}
          startTime={appointment.startTime}
          endTime={appointment.endTime}
        >
          <DetailRow label="Status">{appointment.status}</DetailRow>
          <DetailRow label="Patient">{appointment.patientName}</DetailRow>
        </AppointmentDetails>
        {officeDetails && (
          <p className="mt-6 leading-relaxed text-slate-600">
            Need to make a change? Call {officeDetails.name} at{" "}
            <a href={`tel:${officeDetails.phone}`} className={`${TEXT_LINK} inline`}>
              {officeDetails.phone}
            </a>
            .
          </p>
        )}
        <Links bookAgain />
      </div>
    </Page>
  );
}

function Page({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <>
      <section className={`${CONTAINER} pt-10 sm:pt-14`}>
        <h1 className="font-heading text-4xl font-semibold text-navy sm:text-5xl">{title}</h1>
        {lead && <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-600">{lead}</p>}
      </section>
      <div className={`${CONTAINER} pt-10 pb-16 lg:pb-20`}>{children}</div>
    </>
  );
}

function Links({ bookAgain = false }: { bookAgain?: boolean }) {
  return (
    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
      <Link to="/patient/appointments" className={PRIMARY_BUTTON}>
        View My Appointments
      </Link>
      {bookAgain && (
        <Link to="/book" className={`${TEXT_LINK} text-sm`}>
          Book another appointment
        </Link>
      )}
      <Link to="/" className={`${TEXT_LINK} text-sm`}>
        Back to the homepage
      </Link>
    </div>
  );
}
