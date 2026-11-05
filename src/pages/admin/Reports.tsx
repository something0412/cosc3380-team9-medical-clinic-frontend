import { Link } from "react-router-dom";
import { AdminPage } from "../../components/admin/AdminPage";

const REPORTS = [
  {
    to: "/admin/reports/missed-appointments",
    title: "Missed Appointments",
    question: "Where are no-shows and cancellations coming from, and which patients should the clinic follow up with?",
    uses: "Appointments, patients, doctors, offices, specialties, appointment history",
  },
  {
    to: "/admin/reports/unpaid-balances",
    title: "Unpaid Balances",
    question: "Who owes the clinic money, how long it's been unpaid, and whether patients or insurance are behind.",
    uses: "Invoices, payments, patients, insurance, appointments",
  },
  {
    to: "/admin/reports/schedule-utilization",
    title: "Schedule Utilization",
    question: "How full is each doctor's schedule compared to the time slots they offer?",
    uses: "Doctor schedules, shifts, time slots, appointments, doctors, offices, specialties",
  },
];

// the list of data reports
export function AdminReports() {
  return (
    <AdminPage title="Reports" description="Filter, sort and download reports that answer questions about running the clinic.">
      <div className="grid gap-4 md:grid-cols-3">
        {REPORTS.map((r) => (
          <Link key={r.to} to={r.to} className="block rounded-lg border border-slate-200 bg-white p-5 hover:border-teal-600 hover:bg-slate-50">
            <h2 className="text-lg font-semibold text-navy">{r.title}</h2>
            <p className="mt-2 text-sm text-slate-700">{r.question}</p>
            <p className="mt-3 text-xs text-slate-500">Uses: {r.uses}</p>
          </Link>
        ))}
      </div>
    </AdminPage>
  );
}
