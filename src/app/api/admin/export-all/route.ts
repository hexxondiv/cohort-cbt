import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { buildCohortDownload } from "@/lib/download";
import { listActiveStudentsOrdered } from "@/lib/repository";

export async function GET() {
  const adminSession = await getAdminSession();

  if (!adminSession || adminSession.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const students = listActiveStudentsOrdered();
  const body = buildCohortDownload(students);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="cohort-all-submissions.txt"',
    },
  });
}
