"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DownloadIcon, ResetIcon, SpinnerIcon } from "@/components/admin-action-icons";

const downloadAllLabel = "Download all submissions for the cohort";
const resetAllLabel = "Reset all submissions for the entire cohort";

export function AdminBulkActions() {
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);

  async function handleResetAll() {
    const confirmed = window.confirm(
      "Reset ALL submissions for every student? This permanently deletes every stored attempt and all answers for the entire cohort.",
    );

    if (!confirmed) {
      return;
    }

    setIsResetting(true);

    const response = await fetch("/api/admin/reset-all", {
      method: "POST",
    });

    setIsResetting(false);

    if (!response.ok) {
      window.alert("Reset failed. Try again.");
      return;
    }

    router.refresh();
  }

  return (
    <div
      className="inline-flex divide-x divide-slate-200 overflow-hidden rounded-xl border border-slate-200"
      role="group"
      aria-label="Cohort export and reset"
    >
      <a
        href="/api/admin/export-all"
        className="inline-flex h-10 w-10 items-center justify-center bg-slate-950 text-white transition hover:bg-slate-800"
        aria-label={downloadAllLabel}
        title={downloadAllLabel}
      >
        <DownloadIcon className="h-5 w-5 shrink-0" />
      </a>
      <button
        type="button"
        onClick={() => void handleResetAll()}
        disabled={isResetting}
        className="inline-flex h-10 w-10 items-center justify-center bg-white text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={resetAllLabel}
        title={resetAllLabel}
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
