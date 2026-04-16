import { redirect } from "next/navigation";
import { AssessmentShell } from "@/components/assessment-shell";
import { getStudentSession } from "@/lib/auth";
import { assessmentMeta, questions } from "@/lib/assessment";
import { ensureAttempt, findStudentById, getResponsesForStudent } from "@/lib/repository";
import { getRemainingSeconds, toClientTimestamp } from "@/lib/time";

type AssessmentPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AssessmentPage({ searchParams }: AssessmentPageProps) {
  const session = await getStudentSession();
  const { q } = await searchParams;

  if (!session?.studentId) {
    redirect("/");
  }

  const student = findStudentById(session.studentId);

  if (!student) {
    redirect("/");
  }

  const attempt = ensureAttempt(student.id);
  const responses = getResponsesForStudent(student.id);
  const initialAnswers = Object.fromEntries(
    responses.map((response) => [response.question_id, response.answer_text]),
  );
  const startedAt = toClientTimestamp(attempt.started_at) ?? new Date().toISOString();
  const requestedIndex = Number(q ?? "0");
  const currentIndex = Number.isFinite(requestedIndex)
    ? Math.min(Math.max(Math.trunc(requestedIndex), 0), questions.length - 1)
    : 0;
  const currentQuestion = questions[currentIndex];

  return (
    <AssessmentShell
      key={currentQuestion.id}
      studentName={student.full_name}
      startedAt={startedAt}
      submittedAt={toClientTimestamp(attempt.submitted_at)}
      status={attempt.status}
      questions={questions}
      currentIndex={currentIndex}
      currentQuestion={currentQuestion}
      currentAnswer={initialAnswers[currentQuestion.id] ?? ""}
      initialAnswers={initialAnswers}
      durationMinutes={assessmentMeta.durationMinutes}
      initialRemainingSeconds={getRemainingSeconds(startedAt, assessmentMeta.durationMinutes)}
    />
  );
}
