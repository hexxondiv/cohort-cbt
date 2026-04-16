import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { createStudent, listAllStudentsOrdered } from "@/lib/repository";

const createSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().min(1),
  phone: z.string().min(5),
  moduleAverage: z.union([z.number(), z.null()]).optional(),
});

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
  return { status: 500 as const, body: { error: "Could not save student." } };
}

export async function GET() {
  const adminSession = await getAdminSession();

  if (!adminSession || adminSession.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const students = listAllStudentsOrdered();
  return NextResponse.json({ students });
}

export async function POST(request: Request) {
  const adminSession = await getAdminSession();

  if (!adminSession || adminSession.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = createSchema.parse(await request.json());
    const student = createStudent({
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      moduleAverage: body.moduleAverage ?? null,
    });

    return NextResponse.json({ student });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid student payload." }, { status: 400 });
    }
    if (error instanceof Error) {
      const mapped = mapError(error.message);
      return NextResponse.json(mapped.body, { status: mapped.status });
    }
    return NextResponse.json({ error: "Could not save student." }, { status: 500 });
  }
}
