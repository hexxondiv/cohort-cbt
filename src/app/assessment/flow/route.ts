import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth";
import { questions, questionsById } from "@/lib/assessment";
import { getRequestOrigin } from "@/lib/request-origin";
import { ensureAttempt, saveResponse, submitAttempt } from "@/lib/repository";

function clampIndex(index: number) {
  return Math.min(Math.max(index, 0), questions.length - 1);
}

function getStringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  const session = await getStudentSession();

  if (!session?.studentId) {
    return NextResponse.redirect(new URL("/", await getRequestOrigin(request)));
  }

  const formData = await request.formData();
  const questionId = getStringValue(formData.get("questionId"));
  const answer = getStringValue(formData.get("answer"));
  const currentIndex = clampIndex(Number(getStringValue(formData.get("currentIndex")) || "0"));
  const intent = getStringValue(formData.get("intent"));
  const jumpToRaw = formData.get("jumpTo");
  const jumpTo =
    typeof jumpToRaw === "string" && jumpToRaw.length > 0 ? clampIndex(Number(jumpToRaw)) : null;

  const attempt = ensureAttempt(session.studentId);

  const assessmentUrl = new URL("/assessment", await getRequestOrigin(request));

  if (attempt.status === "submitted") {
    return NextResponse.redirect(assessmentUrl);
  }

  const shouldSave =
    intent === "next" || intent === "submit" || (jumpTo !== null && Number.isFinite(jumpTo));

  if (shouldSave && questionsById.has(questionId)) {
    saveResponse(session.studentId, questionId, answer);
  }

  if (intent === "submit") {
    submitAttempt(session.studentId);
    return NextResponse.redirect(assessmentUrl);
  }

  let nextIndex = currentIndex;

  if (jumpTo !== null && Number.isFinite(jumpTo)) {
    nextIndex = jumpTo;
  } else if (intent === "prev") {
    nextIndex = clampIndex(currentIndex - 1);
  } else if (intent === "next") {
    nextIndex = clampIndex(currentIndex + 1);
  }

  assessmentUrl.searchParams.set("q", String(nextIndex));
  return NextResponse.redirect(assessmentUrl);
}
