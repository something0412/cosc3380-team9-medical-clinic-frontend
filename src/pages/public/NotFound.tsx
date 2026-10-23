import { Link } from "react-router-dom";
import { PRIMARY_BUTTON } from "../../components/public/shared";

export function NotFound() {
  return (
    <section className="bg-slate-50 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-2xl rounded-xl bg-white px-6 py-12 text-center ring-1 ring-slate-200 sm:px-12 sm:py-16">
        <p className="text-sm font-semibold text-teal-700">Page not found</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold text-navy sm:text-4xl">We couldn't find that page</h1>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-slate-600">
          The link may be out of date, or the page may have moved.
        </p>
        <Link to="/" className={`${PRIMARY_BUTTON} mt-8`}>
          Back to Home
        </Link>
      </div>
    </section>
  );
}
