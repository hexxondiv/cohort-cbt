import { AdminBulkActions } from "@/components/admin-bulk-actions";
import { AdminLiveModeSwitch } from "@/components/admin-live-mode";
import { AdminStudentActions } from "@/components/admin-student-actions";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getAdminSession } from "@/lib/auth";
import { getAdminOverview } from "@/lib/repository";
import { formatFixedTimestamp } from "@/lib/time";

type AdminPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await getAdminSession();
  const { error } = await searchParams;

  if (!session || session.role !== "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.35),_transparent_35%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)] px-6 py-12">
        <AdminLoginForm error={error} />
      </main>
    );
  }

  const students = getAdminOverview();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.35),_transparent_35%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)] px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Admin</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Cohort response dashboard</h1>
            <p className="mt-2 text-slate-500">Review progress and download each student&apos;s full answer script.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AdminLiveModeSwitch />
            <AdminBulkActions />
            <AdminLogoutButton />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
            <p className="text-sm text-slate-500">Total students</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{students.length}</p>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
            <p className="text-sm text-slate-500">Submitted</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {students.filter((student) => student.status === "submitted").length}
            </p>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
            <p className="text-sm text-slate-500">In progress</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {students.filter((student) => student.status === "in_progress").length}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr className="text-left text-sm text-slate-500">
                  <th className="px-5 py-4 font-medium">Student</th>
                  <th className="px-5 py-4 font-medium">Phone</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Answered</th>
                  <th className="px-5 py-4 font-medium">Started</th>
                  <th className="px-5 py-4 font-medium">Submitted</th>
                  <th className="px-5 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-950">{student.full_name}</p>
                      <p className="text-slate-500">{student.email}</p>
                    </td>
                    <td className="px-5 py-4">{student.phone_normalized}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          student.status === "submitted"
                            ? "bg-emerald-100 text-emerald-700"
                            : student.status === "in_progress"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">{student.answered_count}/23</td>
                    <td className="px-5 py-4">
                      {formatFixedTimestamp(student.started_at) ?? "-"}
                    </td>
                    <td className="px-5 py-4">
                      {formatFixedTimestamp(student.submitted_at) ?? "-"}
                    </td>
                    <td className="px-5 py-4">
                      <AdminStudentActions studentId={student.id} studentName={student.full_name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
