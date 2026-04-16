import { NextResponse } from "next/server";
import { z } from "zod";
import { getStudentSession } from "@/lib/auth";
import { questionsById } from "@/lib/assessment";
import { ensureAttempt, saveResponse } from "@/lib/repository";

const schema = z.object({
  questionId: z.string(),
  answer: z.string(),
});

export async function POST(request: Request) {
  const session = await getStudentSession();

  if (!session?.studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { questionId, answer } = schema.parse(await request.json());

  if (!questionsById.has(questionId)) {
    return NextResponse.json({ error: "Unknown question." }, { status: 400 });
  }

  const attempt = ensureAttempt(session.studentId);

  if (attempt.status === "submitted") {
    return NextResponse.json({ error: "Assessment already submitted." }, { status: 409 });
  }

  saveResponse(session.studentId, questionId, answer);
  return NextResponse.json({ ok: true });
}
