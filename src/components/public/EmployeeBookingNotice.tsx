import { Link } from "react-router-dom";
import { CONTAINER, PRIMARY_BUTTON, usePortalLink } from "./shared";

// shown on the booking pages instead of patient controls when an employee is signed in
export function EmployeeBookingNotice() {
  const portal = usePortalLink();
  return (
    <section className={`${CONTAINER} pt-10 pb-16 lg:pb-20`}>
      <div className="max-w-2xl border-t border-slate-200 pt-8">
        <h2 className="font-heading text-3xl font-semibold text-navy">Online booking is for patients</h2>
        <p className="mt-3 text-lg leading-relaxed text-slate-600">
          You're signed in with an employee account, so patient booking isn't available here. Patients book online with their
          own patient account.
        </p>
        <Link to={portal.to} className={`${PRIMARY_BUTTON} mt-6`}>
          {`Go to ${portal.label}`}
        </Link>
      </div>
    </section>
  );
}
