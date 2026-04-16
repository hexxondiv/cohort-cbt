"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SpinnerIcon } from "@/components/admin-action-icons";

export function AdminAddStudentForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [moduleAverage, setModuleAverage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedModule = moduleAverage.trim();
    let parsedModule: number | null = null;
    if (trimmedModule.length > 0) {
      const n = Number(trimmedModule);
      if (!Number.isFinite(n)) {
        setError("Module average must be a number.");
        return;
      }
      parsedModule = n;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/admin/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        email,
        phone,
        moduleAverage: parsedModule,
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Could not add student.");
      return;
    }

    setFullName("");
    setEmail("");
    setPhone("");
    setModuleAverage("");
    router.refresh();
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
      <h2 className="text-lg font-semibold text-slate-950">Add student</h2>
      <p className="mt-1 text-sm text-slate-500">
        Create a cohort roster entry. Phone must be unique and a valid Nigerian mobile number.
      </p>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Full name</span>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-sky-400 focus:bg-white"
            autoComplete="name"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-sky-400 focus:bg-white"
            autoComplete="email"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Phone</span>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-sky-400 focus:bg-white"
            autoComplete="tel"
            placeholder="0803…"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Module average (optional)</span>
          <input
            value={moduleAverage}
            onChange={(e) => setModuleAverage(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-sky-400 focus:bg-white"
            inputMode="decimal"
          />
        </label>

        <div className="md:col-span-2 lg:col-span-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {error ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-2 text-sm text-rose-700" role="alert">
              {error}
            </p>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 self-end rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <SpinnerIcon className="h-4 w-4 shrink-0 animate-spin" />
                Saving…
              </>
            ) : (
              "Add to roster"
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
