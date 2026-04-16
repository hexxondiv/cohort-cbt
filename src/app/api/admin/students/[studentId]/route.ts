import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { findStudentById, softDeleteStudent, updateStudent } from "@/lib/repository";

const patchSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().min(1).optional(),
  phone: z.string().min(5).optional(),
  moduleAverage: z.union([z.number(), z.null()]).optional(),
  isActive: z.boolean().optional(),
});

type Context = {
  params: Promise<{ studentId: string }>;
};

function mapError(message: string) {
  if (message === "INVALID_PHONE") {
    return { status: 400 as const, body: { error: "Enter a valid Nigerian phone number." } };
  }
  if (message === "INVALID_INPUT") {
    return { status: 400 as const, body: { error: "Name and email are required." } };
  }
  if (message === "DUPLICATE_PHONE") {
    return { status: 409 as const, body: { error: "Another student already uses this phone number." } };
  }
  return { status: 500 as const, body: { error: "Could not update student." } };
}

export async function PATCH(request: Request, context: Context) {
  const adminSession = await getAdminSession();

  if (!adminSession || adminSession.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { studentId } = await context.params;
  const id = Number(studentId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid student id." }, { status: 400 });
  }

  const existing = findStudentById(id);
  if (!existing) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  try {
    const body = patchSchema.parse(await request.json());
    const student = updateStudent(id, {
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      moduleAverage: body.moduleAverage,
      isActive: body.isActive,
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    return NextResponse.json({ student });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid update payload." }, { status: 400 });
    }
    if (error instanceof Error) {
      const mapped = mapError(error.message);
      return NextResponse.json(mapped.body, { status: mapped.status });
    }
    return NextResponse.json({ error: "Could not update student." }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: Context) {
  const adminSession = await getAdminSession();

  if (!adminSession || adminSession.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { studentId } = await context.params;
  const id = Number(studentId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid student id." }, { status: 400 });
  }

  const existing = findStudentById(id);
  if (!existing) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  const removed = softDeleteStudent(id);
  if (!removed) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
