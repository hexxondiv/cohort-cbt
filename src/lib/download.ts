import { questions } from "@/lib/assessment";
import {
  getAttemptForStudent,
  getResponsesForStudent,
  type AttemptRecord,
  type ResponseRecord,
  type StudentRecord,
} from "@/lib/repository";

export function buildStudentDownload(
  student: StudentRecord,
  attempt: AttemptRecord | undefined,
  responses: ResponseRecord[],
) {
  const responsesMap = new Map(responses.map((response) => [response.question_id, response]));

  const lines = [
    "Educare Tech Hub Cohort Re-Entry CBT",
    "====================================",
    `Student: ${student.full_name}`,
    `Email: ${student.email}`,
    `Phone: ${student.phone_normalized}`,
    `Module 1 Average: ${student.module_average ?? "N/A"}`,
    `Status: ${attempt?.status ?? "not_started"}`,
    `Started At: ${attempt?.started_at ?? "Not started"}`,
    `Submitted At: ${attempt?.submitted_at ?? "Not submitted"}`,
    "",
  ];

  for (const question of questions) {
    const answer = responsesMap.get(question.id)?.answer_text.trim() || "[No answer submitted]";
    lines.push(`${question.section} | Question ${question.number} | ${question.marks} marks`);
    lines.push(question.prompt);
    lines.push("Answer:");
    lines.push(answer);
    lines.push("");
  }

  return lines.join("\n");
}

const COHORT_EXPORT_SEPARATOR = `\n\n${"=".repeat(60)}\n\n`;

export function buildCohortDownload(students: StudentRecord[]) {
  const parts: string[] = [];

  for (const student of students) {
    const attempt = getAttemptForStudent(student.id);
    const responses = getResponsesForStudent(student.id);
    parts.push(buildStudentDownload(student, attempt, responses));
  }

  return parts.join(COHORT_EXPORT_SEPARATOR);
}
