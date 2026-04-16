import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { buildStudentDownload } from "@/lib/download";
import { findStudentById, getAttemptForStudent, getResponsesForStudent } from "@/lib/repository";

type Context = {
  params: Promise<{ studentId: string }>;
};

export async function GET(_: Request, context: Context) {
  const adminSession = await getAdminSession();

  if (!adminSession || adminSession.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { studentId } = await context.params;
  const id = Number(studentId);
  const student = findStudentById(id);

  if (!student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  const attempt = getAttemptForStudent(student.id);
  const responses = getResponsesForStudent(student.id);
  const body = buildStudentDownload(student, attempt, responses);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${student.full_name.replace(/\s+/g, "-").toLowerCase()}-responses.txt"`,
    },
  });
}
