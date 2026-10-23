import { AdminPage } from "../../components/admin/AdminPage";

// placeholder for admin sections that aren't built yet
export function AdminComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <AdminPage title={title} description={description}>
      <section className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
        <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700 ring-1 ring-teal-600/20">
          In development
        </span>
        <p className="mx-auto mt-3 max-w-md text-sm text-slate-600">
          This section is still being built and will be available in an upcoming update.
        </p>
      </section>
    </AdminPage>
  );
}
