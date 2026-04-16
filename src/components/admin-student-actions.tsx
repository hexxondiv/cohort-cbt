"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DownloadIcon, ResetIcon, SpinnerIcon } from "@/components/admin-action-icons";

type Props = {
  studentId: number;
  studentName: string;
};

export function AdminStudentActions({ studentId, studentName }: Props) {
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);

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
