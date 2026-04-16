import { getDb } from "@/lib/db";
import { normalizePhoneNumber } from "@/lib/phone";

export type StudentRecord = {
  id: number;
  full_name: string;
  email: string;
  phone_raw: string;
  phone_normalized: string;
  module_average: number | null;
  is_active: number;
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

export function findStudentByNormalizedPhone(phone: string) {
  const db = getDb();
  return db
    .prepare("SELECT * FROM students WHERE phone_normalized = ?")
    .get(phone) as StudentRecord | undefined;
}

export function findStudentByPhone(phone: string) {
  const student = findStudentByNormalizedPhone(phone);
  if (!student || student.is_active !== 1) {
    return undefined;
  }
  return student;
}

export function findStudentById(studentId: number) {
  const db = getDb();
  return db.prepare("SELECT * FROM students WHERE id = ?").get(studentId) as StudentRecord | undefined;
}

export function listAllStudentsOrdered() {
  const db = getDb();
  return db.prepare("SELECT * FROM students ORDER BY full_name ASC").all() as StudentRecord[];
}

export function createStudent(input: {
  fullName: string;
  email: string;
  phone: string;
  moduleAverage: number | null;
}) {
  const db = getDb();
  let normalized: string;
  try {
    normalized = normalizePhoneNumber(input.phone);
  } catch {
    throw new Error("INVALID_PHONE");
  }

  const fullName = input.fullName.trim();
  const email = input.email.trim();
  const phoneRaw = input.phone.trim();

  if (!fullName || !email) {
    throw new Error("INVALID_INPUT");
  }

  try {
    const result = db
      .prepare(
        `
          INSERT INTO students (full_name, email, phone_raw, phone_normalized, module_average)
          VALUES (?, ?, ?, ?, ?)
        `,
      )
      .run(fullName, email, phoneRaw, normalized, input.moduleAverage);

    return findStudentById(Number(result.lastInsertRowid))!;
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code: string }).code) : "";
    if (code.includes("SQLITE_CONSTRAINT")) {
      throw new Error("DUPLICATE_PHONE");
    }
    throw error;
  }
}

export function updateStudent(
  studentId: number,
  input: {
    fullName?: string;
    email?: string;
    phone?: string;
    moduleAverage?: number | null;
    isActive?: boolean;
  },
) {
  const existing = findStudentById(studentId);
  if (!existing) {
    return null;
  }

  let phoneRaw = existing.phone_raw;
  let normalized = existing.phone_normalized;

  if (input.phone !== undefined) {
    try {
      normalized = normalizePhoneNumber(input.phone);
      phoneRaw = input.phone.trim();
    } catch {
      throw new Error("INVALID_PHONE");
    }
  }

  const fullName = input.fullName !== undefined ? input.fullName.trim() : existing.full_name;
  const email = input.email !== undefined ? input.email.trim() : existing.email;
  const moduleAverage = input.moduleAverage !== undefined ? input.moduleAverage : existing.module_average;
  const isActive =
    input.isActive !== undefined ? (input.isActive ? 1 : 0) : existing.is_active;

  if (!fullName || !email) {
    throw new Error("INVALID_INPUT");
  }

  const db = getDb();

  try {
    db.prepare(
      `
        UPDATE students
        SET
          full_name = ?,
          email = ?,
          phone_raw = ?,
          phone_normalized = ?,
          module_average = ?,
          is_active = ?
        WHERE id = ?
      `,
    ).run(fullName, email, phoneRaw, normalized, moduleAverage, isActive, studentId);
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code: string }).code) : "";
    if (code.includes("SQLITE_CONSTRAINT")) {
      throw new Error("DUPLICATE_PHONE");
    }
    throw error;
  }

  return findStudentById(studentId)!;
}

export function softDeleteStudent(studentId: number) {
  const db = getDb();
  const result = db.prepare("UPDATE students SET is_active = 0 WHERE id = ?").run(studentId);
  return result.changes > 0;
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

/** Sets attempt back to in_progress without deleting saved answers (only when currently submitted). */
export function reopenSubmittedAttempt(studentId: number): "ok" | "no_attempt" | "not_submitted" {
  const db = getDb();
  const attempt = getAttemptForStudent(studentId);
  if (!attempt) {
    return "no_attempt";
  }
  if (attempt.status !== "submitted") {
    return "not_submitted";
  }

  const result = db
    .prepare(
      "UPDATE attempts SET status = 'in_progress', submitted_at = NULL WHERE student_id = ? AND status = 'submitted'",
    )
    .run(studentId);

  return result.changes > 0 ? "ok" : "not_submitted";
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
          students.phone_raw,
          students.phone_normalized,
          students.module_average,
          students.is_active,
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
    phone_raw: string;
    phone_normalized: string;
    module_average: number | null;
    is_active: number;
    started_at: string | null;
    submitted_at: string | null;
    status: string;
    answered_count: number;
  }>;
}
