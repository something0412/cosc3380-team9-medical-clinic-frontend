import { Link } from "react-router-dom";
import { CONTAINER, PUBLIC_LINKS } from "./shared";

const LINK = "text-sm text-white/75 hover:text-white";

export function PublicFooter() {
  return (
    <footer className="bg-navy text-white">
      <div className={`${CONTAINER} grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4`}>
        <div>
          <p className="text-lg font-bold">Medical Clinic</p>
          <p className="mt-2 text-sm text-white/75">Primary and specialty care at clinic offices across several states.</p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-300">Explore</h2>
          <ul className="mt-3 space-y-2">
            {PUBLIC_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className={LINK}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-300">Patients</h2>
          <ul className="mt-3 space-y-2">
            <li>
              <Link to="/login" className={LINK}>
                Patient Portal
              </Link>
            </li>
            <li>
              <Link to="/find-a-doctor" className={LINK}>
                Find a Doctor
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-300">Contact</h2>
          <p className="mt-3 text-sm text-white/75">Phone numbers and addresses for each office are listed on our locations page.</p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link to="/contact" className={LINK}>
                Contact Us
              </Link>
            </li>
            <li>
              <Link to="/locations" className={LINK}>
                Find a Location
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className={`${CONTAINER} flex flex-col gap-2 py-5 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between`}>
          <p>© {new Date().getFullYear()} Medical Clinic. All rights reserved.</p>
          <Link to="/login" className="hover:text-white">
            Employee Access
          </Link>
        </div>
      </div>
    </footer>
  );
}
