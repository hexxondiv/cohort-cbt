"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "cohort-admin-dashboard-mode";

type DashboardMode = "live" | "static";

function readStoredMode(): DashboardMode {
  if (typeof window === "undefined") {
    return "static";
  }
  return window.localStorage.getItem(STORAGE_KEY) === "live" ? "live" : "static";
}

export function AdminLiveModeSwitch() {
  const router = useRouter();
  const [mode, setMode] = useState<DashboardMode>("static");

  useEffect(() => {
    setMode(readStoredMode());
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode);
    if (mode !== "live") {
      return;
    }
    router.refresh();
    const id = window.setInterval(() => {
      router.refresh();
    }, 5_000);
    return () => window.clearInterval(id);
  }, [mode, router]);

  return (
    <div
      className="inline-flex divide-x divide-slate-200 overflow-hidden rounded-xl border border-slate-200"
      role="group"
      aria-label="Dashboard refresh mode"
    >
      <button
        type="button"
        onClick={() => setMode("static")}
        className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
          mode === "static"
            ? "bg-slate-950 text-white"
            : "bg-white text-slate-600 hover:bg-slate-50"
        }`}
        aria-pressed={mode === "static"}
      >
        Static
      </button>
      <button
        type="button"
        onClick={() => setMode("live")}
        className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
          mode === "live"
            ? "bg-emerald-600 text-white"
            : "bg-white text-slate-600 hover:bg-slate-50"
        }`}
        aria-pressed={mode === "live"}
      >
        {mode === "live" && (
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden title="Refreshing">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-300 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white/40" />
          </span>
        )}
        Live
      </button>
    </div>
  );
}
