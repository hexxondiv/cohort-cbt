import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { findStudentById, reopenSubmittedAttempt } from "@/lib/repository";

type Context = {
  params: Promise<{ studentId: string }>;
};

export async function POST(_: Request, context: Context) {
  const adminSession = await getAdminSession();

  if (!adminSession || adminSession.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { studentId } = await context.params;
  const id = Number(studentId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid student id." }, { status: 400 });
  }

  const student = findStudentById(id);

  if (!student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  const result = reopenSubmittedAttempt(student.id);

  if (result === "no_attempt") {
    return NextResponse.json(
      { error: "No attempt on file for this student." },
      { status: 400 },
    );
  }

  if (result === "not_submitted") {
    return NextResponse.json(
      { error: "Only a submitted assessment can be returned to in progress." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
