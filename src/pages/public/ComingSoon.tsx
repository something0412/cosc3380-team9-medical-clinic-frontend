import { Link } from "react-router-dom";
import { PRIMARY_BUTTON } from "../../components/public/shared";

// shared placeholder for public pages that aren't built yet
export function ComingSoon({ title }: { title: string }) {
  return (
    <section className="bg-slate-50 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-2xl rounded-xl bg-white px-6 py-12 text-center ring-1 ring-slate-200 sm:px-12 sm:py-16">
        <p className="text-sm font-semibold text-teal-700">Coming soon</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold text-navy sm:text-4xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-slate-600">
          We're still building this page. It will be available on our website soon.
        </p>
        <Link to="/" className={`${PRIMARY_BUTTON} mt-8`}>
          Back to Home
        </Link>
      </div>
    </section>
  );
}
