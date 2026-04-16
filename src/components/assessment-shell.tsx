"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AssessmentQuestion } from "@/lib/assessment";
import { formatFixedTimestamp, getRemainingSeconds } from "@/lib/time";

type Props = {
  studentName: string;
  startedAt: string;
  submittedAt: string | null;
  status: string;
  questions: AssessmentQuestion[];
  currentIndex: number;
  currentQuestion: AssessmentQuestion;
  currentAnswer: string;
  initialAnswers: Record<string, string>;
  durationMinutes: number;
  initialRemainingSeconds: number;
};

const SAVE_DELAY_MS = 700;
const AUTOSAVE_ENABLED = false;
const DRAFT_STORAGE_KEY = "assessment-draft-answers";

function formatTime(totalSeconds: number) {
  const safeSeconds = Math.max(totalSeconds, 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

export function AssessmentShell({
  studentName,
  startedAt,
  submittedAt,
  status,
  questions,
  currentIndex,
  currentQuestion,
  currentAnswer,
  initialAnswers,
  durationMinutes,
  initialRemainingSeconds,
}: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => initialAnswers);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [remainingSeconds, setRemainingSeconds] = useState(initialRemainingSeconds);
  const [toast, setToast] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);
  const submitConfirmRef = useRef<HTMLDialogElement | null>(null);
  const timedSubmitButtonRef = useRef<HTMLButtonElement | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRequestIdRef = useRef(0);

  const answeredCount = useMemo(
    () => questions.filter((question) => (answers[question.id] ?? "").trim().length > 0).length,
    [answers, questions],
  );
  const unansweredCount = questions.length - answeredCount;
  const assessmentEnded = status === "submitted";

  const answerForCurrentQuestion =
    answers[currentQuestion.id] ?? initialAnswers[currentQuestion.id] ?? currentAnswer ?? "";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const storedDrafts = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);

      if (!storedDrafts) {
        return;
      }

      const parsedDrafts = JSON.parse(storedDrafts);

      if (!parsedDrafts || typeof parsedDrafts !== "object" || Array.isArray(parsedDrafts)) {
        return;
      }

      const draftAnswers = Object.fromEntries(
        Object.entries(parsedDrafts).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
      );

      setAnswers((current) => ({ ...current, ...draftAnswers }));
    } catch {
      window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, [currentAnswer, currentQuestion.id, initialAnswers]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (assessmentEnded) {
      window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      return;
    }

    try {
      window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(answers));
    } catch {
      // Ignore storage failures so the assessment remains usable.
    }
  }, [answers, assessmentEnded]);

  useEffect(() => {
    function updateTime() {
      const nextRemaining = getRemainingSeconds(startedAt, durationMinutes);
      setRemainingSeconds(nextRemaining);
      if (nextRemaining <= 0 && !assessmentEnded) {
        timedSubmitButtonRef.current?.click();
      }
    }

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [assessmentEnded, durationMinutes, startedAt]);

  useEffect(() => {
    if (assessmentEnded) {
      return;
    }

    const block = (event: Event) => event.preventDefault();
    const blockKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && ["c", "v", "x", "u", "s", "p"].includes(event.key.toLowerCase())) {
        event.preventDefault();
      }
    };

    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("paste", block);
    document.addEventListener("contextmenu", block);
    document.addEventListener("keydown", blockKey);

    return () => {
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("paste", block);
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("keydown", blockKey);
    };
  }, [assessmentEnded]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  function queueSave(questionId: string, answer: string) {
    if (!AUTOSAVE_ENABLED) {
      return;
    }

    if (assessmentEnded) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveState("saving");
    const requestId = ++saveRequestIdRef.current;
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch("/api/assessment/answer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ questionId, answer }),
        });

        if (!response.ok) {
          throw new Error("Autosave request failed.");
        }

        if (requestId !== saveRequestIdRef.current) {
          return;
        }

        setSaveState("saved");
        setToast("Answer saved.");
        window.setTimeout(() => setToast(""), 1200);
      } catch {
        if (requestId !== saveRequestIdRef.current) {
          return;
        }

        setSaveState("error");
        setToast("Autosave failed. Your latest change is still in the browser.");
      }
    }, SAVE_DELAY_MS);
  }

  function updateAnswer(questionId: string, answer: string) {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
    queueSave(questionId, answer);
  }

  function openSubmitConfirm() {
    submitConfirmRef.current?.showModal();
  }

  function closeSubmitConfirm() {
    submitConfirmRef.current?.close();
  }

  function confirmFinalSubmit() {
    const form = formRef.current;
    const submitter = timedSubmitButtonRef.current;
    closeSubmitConfirm();
    if (form && submitter) {
      form.requestSubmit(submitter);
    }
  }

  if (assessmentEnded) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
        <div className="rounded-[2rem] border border-emerald-200 bg-white p-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Submitted</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">Assessment locked</h1>
          <p className="mt-4 text-slate-600">
            {studentName}, your responses have been recorded successfully.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Submitted at {formatFixedTimestamp(submittedAt) ?? "completed"}.
          </p>
          <form action="/auth/logout" method="post" className="mt-6">
            <button
              type="submit"
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <form
        ref={formRef}
        action="/assessment/flow"
        method="post"
        className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6"
      >
        <input type="hidden" name="questionId" value={currentQuestion.id} />
        <input type="hidden" name="currentIndex" value={currentIndex} />
        <aside className="lg:w-80">
          <div className="sticky top-6 space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Candidate</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">{studentName}</h1>
          </div>

          <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Time left</p>
            <p className="mt-2 font-mono text-3xl">{formatTime(remainingSeconds)}</p>
          </div>

          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Progress</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {answeredCount}/{questions.length}
            </p>
            <p className="mt-1 text-sm text-slate-500">One question at a time.</p>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {questions.map((question, index) => {
              const answered = (answers[question.id] ?? "").trim().length > 0;
              const active = index === currentIndex;

              return (
                <button
                  key={question.id}
                  type="submit"
                  name="jumpTo"
                  value={index}
                  className={`h-11 rounded-2xl border text-sm font-semibold transition ${
                    active
                      ? "border-slate-950 bg-slate-950 text-white"
                      : answered
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {question.number}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={openSubmitConfirm}
            className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
          >
            Submit assessment
          </button>

          <button
            type="submit"
            formAction="/auth/logout"
            formMethod="post"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
          >
            Log out
          </button>
            <button
              type="submit"
              name="intent"
              value="submit"
              ref={timedSubmitButtonRef}
              className="hidden"
              aria-hidden
              tabIndex={-1}
            >
              Timed submit
            </button>
          </div>
        </aside>

        <section className="flex-1">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)] md:p-8">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">{currentQuestion.section}</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Question {currentQuestion.number}: {currentQuestion.prompt}
              </h2>
              <p className="mt-2 text-sm text-slate-500">{currentQuestion.marks} marks</p>
            </div>

            {AUTOSAVE_ENABLED ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {saveState === "saving"
                  ? "Saving..."
                  : saveState === "saved"
                    ? "Saved"
                    : saveState === "error"
                      ? "Save failed"
                      : "Ready"}
              </div>
            ) : null}
          </div>

          {currentQuestion.instructions?.length ? (
            <div className="mt-6 space-y-3 rounded-3xl bg-sky-50 p-5">
              {currentQuestion.instructions.map((instruction) => (
                <p key={instruction} className="text-sm leading-7 text-slate-700">
                  {instruction}
                </p>
              ))}
            </div>
          ) : null}

          <div className="mt-8">
            {currentQuestion.kind === "multiple-choice" ? (
              <div className="space-y-3">
                {currentQuestion.options?.map((option) => (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-start gap-3 rounded-3xl border px-4 py-4 transition ${
                      answers[currentQuestion.id] === option
                        ? "border-sky-500 bg-sky-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={option}
                      checked={answerForCurrentQuestion === option}
                      onChange={() => updateAnswer(currentQuestion.id, option)}
                      className="mt-1 h-4 w-4 accent-sky-600"
                    />
                    <span className="text-sm leading-7 text-slate-700">{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                name="answer"
                value={answerForCurrentQuestion}
                onChange={(event) => updateAnswer(currentQuestion.id, event.target.value)}
                placeholder={currentQuestion.placeholder}
                spellCheck={false}
                className={`min-h-[360px] w-full rounded-[1.75rem] border border-slate-200 bg-slate-50 px-5 py-4 text-base leading-7 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white ${
                  currentQuestion.kind === "code" ? "font-mono" : ""
                }`}
              />
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-between">
            <button
              type="submit"
              name="intent"
              value="prev"
              disabled={currentIndex === 0}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous question
            </button>

            <button
              type="submit"
              name="intent"
              value="next"
              disabled={currentIndex === questions.length - 1}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next question
            </button>
          </div>

          {toast ? <p className="mt-4 text-sm text-slate-500">{toast}</p> : null}
        </div>
        </section>
      </form>

      <dialog
        ref={submitConfirmRef}
        className="w-[min(100%,26rem)] rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop:bg-slate-950/40"
        aria-labelledby="submit-confirm-title"
      >
        <div className="space-y-4">
          <div>
            <h3 id="submit-confirm-title" className="text-lg font-semibold text-slate-950">
              Submit assessment?
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your answers will be saved and the assessment will be locked. You will not be able to change your
              responses after this.
            </p>
            <p className="mt-3 text-sm text-slate-700">
              <span className="font-semibold text-slate-950">
                {answeredCount}/{questions.length}
              </span>{" "}
              questions have an answer.
            </p>
            {unansweredCount > 0 ? (
              <p className="mt-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {unansweredCount === 1
                  ? "1 question still has no answer."
                  : `${unansweredCount} questions still have no answer.`}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={closeSubmitConfirm}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmFinalSubmit}
              className="rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              Yes, submit now
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
