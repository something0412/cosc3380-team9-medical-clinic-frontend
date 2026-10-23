import { Link } from "react-router-dom";

export function DoctorDashboard() {
  return (
    <main className="mx-auto min-h-screen w-[calc(100%-40px)] max-w-[1200px] font-sans">
      <header className="mb-5"><h1 className="text-3xl font-bold">Hello, DOCTORNAME</h1><p>Here's some information:</p></header>

      <div className="grid grid-cols-1 gap-5 min-[901px]:grid-cols-3">
        <section className="flex h-[500px] min-h-0 flex-col rounded-[10px] border border-black p-4" aria-labelledby="appointments-heading">
          <div className="mb-3 flex items-center justify-between gap-4"><h2 id="appointments-heading">Appointments</h2><Link to="/doctor/appointments">View all</Link></div>
          <ul className="min-h-0 flex-1 list-none overflow-y-auto">
            <li className="border border-black p-[10px]"><h3>Patient Name</h3><time dateTime="2026-10-18T14:30">2:30 PM</time></li>
            <li className="border border-black p-[10px]"><h3>Another Patient</h3><time dateTime="2026-10-18T15:00">3:00 PM</time></li>
          </ul>
        </section>

        <section className="flex h-[500px] min-h-0 flex-col rounded-[10px] border border-black p-4" aria-labelledby="labs-heading">
          <div className="mb-3 flex items-center justify-between gap-4"><h2 id="labs-heading">Lab Orders</h2><Link to="/doctor/lab-orders">View all</Link></div>
          <ul className="min-h-0 flex-1 list-none overflow-y-auto">
            <li className="border border-black p-[10px]"><h3>Lab Order #123</h3><p>Completed</p></li>
          </ul>
        </section>

        <section className="flex h-[500px] min-h-0 flex-col rounded-[10px] border border-black p-4" aria-labelledby="referrals-heading">
          <div className="mb-3 flex items-center justify-between gap-4"><h2 id="referrals-heading">Referrals</h2><Link to="/doctor/referrals">View all</Link></div>
          <ul className="min-h-0 flex-1 list-none overflow-y-auto">
            <li className="border border-black p-[10px]"><h3>Dr. Example</h3><p>Pending</p></li>
          </ul>
        </section>
      </div>
    </main>
  );
}