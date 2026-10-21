import { Link } from "react-router-dom";
import { PRIMARY_BUTTON } from "../../components/public/shared";

// shared placeholder for public pages that aren't built yet
export function ComingSoon({ title }: { title: string }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-600">Coming soon</p>
      <h1 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">{title}</h1>
      <p className="mx-auto mt-4 max-w-xl text-gray-600">
        We're still building this page. It will be available on our website soon.
      </p>
      <Link to="/" className={`${PRIMARY_BUTTON} mt-8`}>
        Back to Home
      </Link>
    </section>
  );
}
