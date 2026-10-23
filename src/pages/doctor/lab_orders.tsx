export default function LabOrders() {
  return (
    <main className="mx-auto flex min-h-screen w-[calc(100%-40px)] max-w-[1200px] flex-col gap-5 font-sans">
      <header className="flex items-center justify-between"><h1 className="text-2xl font-bold">Lab Orders</h1><button type="button" className="rounded border border-black px-4 py-2">Create Order</button></header>

      <section className="grid grid-cols-2 gap-5">
        <div className="rounded-[10px] border border-black p-4"><h2>Results Available</h2><p className="text-2xl">2</p></div>
        <div className="rounded-[10px] border border-black p-4"><h2>Pending</h2><p className="text-2xl">2</p></div>
      </section>

      <section className="flex h-[500px] min-h-0 flex-col rounded-[10px] border border-black p-4">
        <div className="mb-4 flex gap-4">
        <select className="rounded border border-black px-3 py-2">
            <option value="">Sort By</option>
            <option value="date">Date</option>
            <option value="status">Status</option>
            <option value="patient">Patient</option>
        </select>
        <select className="rounded border border-black px-3 py-2">
            <option value="">All Patients</option>
        </select>
        </div>

        <ul className="min-h-0 flex-1 list-none overflow-y-auto">
          <li className="border border-black p-[10px]"><h3>Complete Blood Count</h3><p>Patient Name</p><p>Completed</p></li>
          <li className="border border-black p-[10px]"><h3>Metabolic Panel</h3><p>Patient Name</p><p>Pending</p></li>
        </ul>
      </section>
    </main>
  );
}