import { getDb } from "@/lib/db";

export type StudentRecord = {
  id: number;
  full_name: string;
  email: string;
  phone_raw: string;
  phone_normalized: string;
  module_average: number | null;
};

export type AttemptRecord = {
  student_id: number;
  started_at: string;
  submitted_at: string | null;
  status: string;
};

export type ResponseRecord = {
  question_id: string;
  answer_text: string;
  saved_at: string;
};

export function findStudentByPhone(phone: string) {
  const db = getDb();
  return db
    .prepare("SELECT * FROM students WHERE phone_normalized = ? AND is_active = 1")
    .get(phone) as StudentRecord | undefined;
}

export function findStudentById(studentId: number) {
  const db = getDb();
  return db.prepare("SELECT * FROM students WHERE id = ?").get(studentId) as StudentRecord | undefined;
}

export function listActiveStudentsOrdered() {
  const db = getDb();
  return db
    .prepare("SELECT * FROM students WHERE is_active = 1 ORDER BY full_name ASC")
    .all() as StudentRecord[];
}

export function ensureAttempt(studentId: number) {
  const db = getDb();
  db.prepare(
    "INSERT INTO attempts (student_id) VALUES (?) ON CONFLICT(student_id) DO NOTHING",
  ).run(studentId);

  return db
    .prepare("SELECT student_id, started_at, submitted_at, status FROM attempts WHERE student_id = ?")
    .get(studentId) as AttemptRecord;
}

export function getAttemptForStudent(studentId: number) {
  const db = getDb();
  return db
    .prepare("SELECT student_id, started_at, submitted_at, status FROM attempts WHERE student_id = ?")
    .get(studentId) as AttemptRecord | undefined;
}

export function saveResponse(studentId: number, questionId: string, answerText: string) {
  const db = getDb();
  db.prepare(
    `
      INSERT INTO responses (student_id, question_id, answer_text, saved_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, question_id) DO UPDATE SET
        answer_text = excluded.answer_text,
        saved_at = CURRENT_TIMESTAMP
    `,
  ).run(studentId, questionId, answerText);
}

export function saveResponses(studentId: number, responses: Record<string, string>) {
  const db = getDb();
  const statement = db.prepare(
    `
      INSERT INTO responses (student_id, question_id, answer_text, saved_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, question_id) DO UPDATE SET
        answer_text = excluded.answer_text,
        saved_at = CURRENT_TIMESTAMP
    `,
  );

  const transaction = db.transaction(() => {
    for (const [questionId, answerText] of Object.entries(responses)) {
      statement.run(studentId, questionId, answerText);
    }
  });

  transaction();
}

export function getResponsesForStudent(studentId: number) {
  const db = getDb();
  return db
    .prepare("SELECT question_id, answer_text, saved_at FROM responses WHERE student_id = ?")
    .all(studentId) as ResponseRecord[];
}

export function submitAttempt(studentId: number) {
  const db = getDb();
  db.prepare(
    "UPDATE attempts SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP WHERE student_id = ?",
  ).run(studentId);

  return db
    .prepare("SELECT student_id, started_at, submitted_at, status FROM attempts WHERE student_id = ?")
    .get(studentId) as AttemptRecord;
}

export function resetStudentSubmission(studentId: number) {
  const db = getDb();

  const transaction = db.transaction(() => {
    db.prepare("DELETE FROM responses WHERE student_id = ?").run(studentId);
    db.prepare("DELETE FROM attempts WHERE student_id = ?").run(studentId);
  });

  transaction();
}

export function resetAllSubmissions() {
  const db = getDb();
  const transaction = db.transaction(() => {
    db.prepare("DELETE FROM responses").run();
    db.prepare("DELETE FROM attempts").run();
  });
  transaction();
}

export function getAdminOverview() {
  const db = getDb();
  return db
    .prepare(
      `
        SELECT
          students.id,
          students.full_name,
          students.email,
          students.phone_normalized,
          students.module_average,
          attempts.started_at,
          attempts.submitted_at,
          COALESCE(attempts.status, 'not_started') AS status,
          COUNT(responses.id) AS answered_count
        FROM students
        LEFT JOIN attempts ON attempts.student_id = students.id
        LEFT JOIN responses ON responses.student_id = students.id
        GROUP BY students.id
        ORDER BY students.full_name ASC
      `,
    )
    .all() as Array<{
    id: number;
    full_name: string;
    email: string;
    phone_normalized: string;
    module_average: number | null;
    started_at: string | null;
    submitted_at: string | null;
    status: string;
    answered_count: number;
  }>;
}
