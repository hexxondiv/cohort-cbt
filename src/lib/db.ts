import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { normalizePhoneNumber } from "@/lib/phone";
import { preregisteredStudents } from "@/lib/students";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "cbt.sqlite");

declare global {
  var __cbtDb: Database.Database | undefined;
}

function initializeDatabase(db: Database.Database) {
  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone_raw TEXT NOT NULL,
      phone_normalized TEXT NOT NULL UNIQUE,
      module_average REAL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL UNIQUE,
      started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      submitted_at TEXT,
      status TEXT NOT NULL DEFAULT 'in_progress',
      FOREIGN KEY(student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      question_id TEXT NOT NULL,
      answer_text TEXT NOT NULL DEFAULT '',
      saved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, question_id),
      FOREIGN KEY(student_id) REFERENCES students(id)
    );
  `);

  const insertStudent = db.prepare(`
    INSERT INTO students (full_name, email, phone_raw, phone_normalized, module_average)
    VALUES (@fullName, @email, @phone, @normalizedPhone, @moduleAverage)
    ON CONFLICT(phone_normalized) DO UPDATE SET
      full_name = excluded.full_name,
      email = excluded.email,
      phone_raw = excluded.phone_raw,
      module_average = excluded.module_average,
      is_active = 1
  `);

  const transaction = db.transaction(() => {
    for (const student of preregisteredStudents) {
      insertStudent.run({
        ...student,
        normalizedPhone: normalizePhoneNumber(student.phone),
      });
    }
  });

  transaction();
}

export function getDb() {
  if (!global.__cbtDb) {
    fs.mkdirSync(dataDir, { recursive: true });
    global.__cbtDb = new Database(dbPath);
    initializeDatabase(global.__cbtDb);
  }

  return global.__cbtDb;
}
