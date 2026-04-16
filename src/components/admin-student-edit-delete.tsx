"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { PencilIcon, SpinnerIcon, TrashIcon } from "@/components/admin-action-icons";

type Props = {
  studentId: number;
  fullName: string;
  email: string;
  phoneRaw: string;
  moduleAverage: number | null;
  isActive: boolean;
};

export function AdminStudentEditDelete({
  studentId,
  fullName,
  email,
  phoneRaw,
  moduleAverage,
  isActive,
}: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draftName, setDraftName] = useState(fullName);
  const [draftEmail, setDraftEmail] = useState(email);
  const [draftPhone, setDraftPhone] = useState(phoneRaw);
  const [draftModule, setDraftModule] = useState(moduleAverage === null ? "" : String(moduleAverage));
  const [draftActive, setDraftActive] = useState(isActive);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openDialog() {
    setDraftName(fullName);
    setDraftEmail(email);
    setDraftPhone(phoneRaw);
    setDraftModule(moduleAverage === null ? "" : String(moduleAverage));
    setDraftActive(isActive);
    setError(null);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedModule = draftModule.trim();
    let parsedModule: number | null = null;
    if (trimmedModule.length > 0) {
      const n = Number(trimmedModule);
      if (!Number.isFinite(n)) {
        setError("Module average must be a number.");
        return;
      }
      parsedModule = n;
    }

    setIsSaving(true);

    const response = await fetch(`/api/admin/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: draftName,
        email: draftEmail,
        phone: draftPhone,
        moduleAverage: parsedModule,
        isActive: draftActive,
      }),
    });

    setIsSaving(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Could not save changes.");
      return;
    }

    closeDialog();
    router.refresh();
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Remove ${fullName} from the cohort? They will not be able to sign in. You can restore access later by editing them and re-enabling cohort login.`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    const response = await fetch(`/api/admin/students/${studentId}`, {
      method: "DELETE",
    });

    setIsDeleting(false);

    if (!response.ok) {
      window.alert("Remove failed. Try again.");
      return;
    }

    closeDialog();
    router.refresh();
  }

  const editLabel = `Edit roster entry for ${fullName}`;
  const deleteLabel = `Remove ${fullName} from cohort`;

  return (
    <>
      <div
        className="inline-flex divide-x divide-slate-200 overflow-hidden rounded-xl border border-slate-200"
        role="group"
        aria-label={`Roster actions for ${fullName}`}
      >
        <button
          type="button"
          onClick={openDialog}
          className="inline-flex h-10 w-10 items-center justify-center bg-white text-slate-700 transition hover:bg-slate-50"
          aria-label={editLabel}
          title={editLabel}
        >
          <PencilIcon className="h-5 w-5 shrink-0" />
        </button>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={isDeleting}
          className="inline-flex h-10 w-10 items-center justify-center bg-white text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={deleteLabel}
          title={deleteLabel}
        >
          {isDeleting ? (
            <SpinnerIcon className="h-5 w-5 shrink-0 animate-spin" />
          ) : (
            <TrashIcon className="h-5 w-5 shrink-0" />
          )}
        </button>
      </div>

      <dialog
        ref={dialogRef}
        className="w-[min(100%,28rem)] rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop:bg-slate-950/40"
      >
        <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Edit student</h3>
            <p className="mt-1 text-sm text-slate-500">Update roster details or access.</p>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Full name</span>
            <input
              required
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-sky-400 focus:bg-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Email</span>
            <input
              required
              type="email"
              value={draftEmail}
              onChange={(e) => setDraftEmail(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-sky-400 focus:bg-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Phone</span>
            <input
              required
              value={draftPhone}
              onChange={(e) => setDraftPhone(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-sky-400 focus:bg-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Module average (optional)</span>
            <input
              value={draftModule}
              onChange={(e) => setDraftModule(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-sky-400 focus:bg-white"
              inputMode="decimal"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={draftActive}
              onChange={(e) => setDraftActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Cohort login allowed
          </label>

          {error ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-2 text-sm text-rose-700" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeDialog}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <SpinnerIcon className="h-4 w-4 shrink-0 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
