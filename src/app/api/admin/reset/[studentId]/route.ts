import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { findStudentById, resetStudentSubmission } from "@/lib/repository";

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

  resetStudentSubmission(student.id);
  return NextResponse.json({ ok: true });
}
