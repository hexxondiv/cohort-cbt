import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getStudentSession } from "@/lib/auth";
import { assessmentMeta } from "@/lib/assessment";

type HomePageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await getStudentSession();
  const { error } = await searchParams;

  if (session?.studentId) {
    redirect("/assessment");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.4),_transparent_35%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)] px-6 py-12">
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="flex flex-col justify-center rounded-[2.5rem] border border-white/60 bg-white/70 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-600">Educare Tech Hub</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
            Cohort Assessment
          </h1>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Duration</p>
              <p className="mt-3 text-3xl font-semibold">{assessmentMeta.durationMinutes / 60} hours</p>
            </div>
            <div className="rounded-[1.75rem] bg-white p-5 ring-1 ring-slate-200">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Questions</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">23</p>
            </div>
            <div className="rounded-[1.75rem] bg-white p-5 ring-1 ring-slate-200">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Total marks</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{assessmentMeta.totalMarks}</p>
            </div>
          </div>

          <div className="mt-10 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div className="rounded-[1.5rem] bg-sky-50 px-4 py-4">Answer one question at a time and move between questions with the navigation controls.</div>
            <div className="rounded-[1.5rem] bg-sky-50 px-4 py-4">Your answers are saved automatically while you work.</div>
            <div className="rounded-[1.5rem] bg-sky-50 px-4 py-4">Copy, cut, paste, and right-click actions are disabled during the assessment.</div>
            <div className="rounded-[1.5rem] bg-sky-50 px-4 py-4">Log in with the phone number you used during bootcamp registration.</div>
            <div className="rounded-[1.5rem] bg-sky-50 px-4 py-4">The assessment is locked immediately after submission or when the allotted time runs out.</div>
          </div>

          <div className="mt-8 max-w-xl rounded-[2rem] border border-sky-200 bg-[linear-gradient(135deg,_#eff8ff_0%,_#ffffff_55%,_#fef3c7_100%)] px-6 py-5 shadow-[0_20px_50px_rgba(14,165,233,0.08)]">
            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Best of luck.</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Stay calm, manage your time well, and submit only when you are satisfied with your responses.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-lg">
            <LoginForm error={error} />
          </div>
        </section>
      </div>
    </main>
  );
}
