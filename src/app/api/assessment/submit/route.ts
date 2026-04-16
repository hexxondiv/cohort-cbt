import { NextResponse } from "next/server";
import { z } from "zod";
import { getStudentSession } from "@/lib/auth";
import { questionsById } from "@/lib/assessment";
import { ensureAttempt, saveResponses, submitAttempt } from "@/lib/repository";

const schema = z.object({
  forced: z.boolean().optional(),
  answers: z.record(z.string(), z.string()).default({}),
});

export async function POST(request: Request) {
  const session = await getStudentSession();

  if (!session?.studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { answers } = schema.parse(await request.json());

  const attempt = ensureAttempt(session.studentId);

  if (attempt.status === "submitted") {
    return NextResponse.json({ ok: true });
  }

  const filteredAnswers = Object.fromEntries(
    Object.entries(answers).filter(([questionId]) => questionsById.has(questionId)),
  );

  saveResponses(session.studentId, filteredAnswers);

  submitAttempt(session.studentId);
  return NextResponse.json({ ok: true });
}
