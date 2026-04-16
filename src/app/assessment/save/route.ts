import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth";
import { questionsById } from "@/lib/assessment";
import { ensureAttempt, saveResponse } from "@/lib/repository";

function getStringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  const session = await getStudentSession();

  if (!session?.studentId) {
    return new NextResponse("<html><body>unauthorized</body></html>", {
      status: 401,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const formData = await request.formData();
  const questionId = getStringValue(formData.get("questionId"));
  const answer = getStringValue(formData.get("answer"));

  if (!questionsById.has(questionId)) {
    return new NextResponse("<html><body>invalid-question</body></html>", {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const attempt = ensureAttempt(session.studentId);

  if (attempt.status !== "submitted") {
    saveResponse(session.studentId, questionId, answer);
  }

  return new NextResponse("<html><body>saved</body></html>", {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
