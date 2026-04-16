"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DownloadIcon, ResetIcon, ReturnToProgressIcon, SpinnerIcon } from "@/components/admin-action-icons";

type Props = {
  studentId: number;
  studentName: string;
  attemptStatus: string;
};

export function AdminStudentActions({ studentId, studentName, attemptStatus }: Props) {
  const router = useRouter();
  const [isReopening, setIsReopening] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const canReturnToProgress = attemptStatus === "submitted";

  async function handleReturnToProgress() {
    const confirmed = window.confirm(
      `Return ${studentName}'s assessment to in progress? Their saved answers will stay on file; only the submitted status will be cleared so they can continue or resubmit.`,
    );

    if (!confirmed) {
      return;
    }

    setIsReopening(true);

    const response = await fetch(`/api/admin/reopen-attempt/${studentId}`, {
      method: "POST",
    });

    setIsReopening(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      window.alert(data?.error ?? "Could not update attempt.");
      return;
    }

    router.refresh();
  }

  async function handleReset() {
    const confirmed = window.confirm(
      `Reset ${studentName}'s submission? This will permanently clear the stored attempt and all answers.`,
    );

    if (!confirmed) {
      return;
    }

    setIsResetting(true);

    const response = await fetch(`/api/admin/reset/${studentId}`, {
      method: "POST",
    });

    setIsResetting(false);

    if (!response.ok) {
      window.alert("Reset failed. Try again.");
      return;
    }

    router.refresh();
  }

  const downloadLabel = `Download answer script for ${studentName}`;
  const returnLabel = `Return ${studentName}'s assessment to in progress (keep answers)`;
  const returnDisabledTitle = "Only available when status is submitted.";
  const resetLabel = `Reset submission for ${studentName}`;

  return (
    <div
      className="inline-flex divide-x divide-slate-200 overflow-hidden rounded-xl border border-slate-200"
      role="group"
      aria-label={`Actions for ${studentName}`}
    >
      <a
        href={`/api/admin/export/${studentId}`}
        className="inline-flex h-10 w-10 items-center justify-center bg-slate-950 text-white transition hover:bg-slate-800"
        aria-label={downloadLabel}
        title={downloadLabel}
      >
        <DownloadIcon className="h-5 w-5 shrink-0" />
      </a>
      <button
        type="button"
        onClick={() => void handleReturnToProgress()}
        disabled={!canReturnToProgress || isReopening}
        aria-disabled={!canReturnToProgress || isReopening}
        className="inline-flex h-10 w-10 items-center justify-center bg-white text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={canReturnToProgress ? returnLabel : returnDisabledTitle}
        title={canReturnToProgress ? returnLabel : returnDisabledTitle}
      >
        {isReopening ? (
          <SpinnerIcon className="h-5 w-5 shrink-0 animate-spin" />
        ) : (
          <ReturnToProgressIcon className="h-5 w-5 shrink-0" />
        )}
      </button>
      <button
        type="button"
        onClick={() => void handleReset()}
        disabled={isResetting}
        className="inline-flex h-10 w-10 items-center justify-center bg-white text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={resetLabel}
        title={resetLabel}
      >
        {isResetting ? (
          <SpinnerIcon className="h-5 w-5 shrink-0 animate-spin" />
        ) : (
          <ResetIcon className="h-5 w-5 shrink-0" />
        )}
      </button>
    </div>
  );
}
