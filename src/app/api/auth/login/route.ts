import { NextResponse } from "next/server";
import { z } from "zod";
import { createStudentSession } from "@/lib/auth";
import { normalizePhoneNumber } from "@/lib/phone";
import { ensureAttempt, findStudentByPhone } from "@/lib/repository";

const schema = z.object({
  phone: z.string().min(5),
});

export async function POST(request: Request) {
  try {
    const { phone } = schema.parse(await request.json());
    const normalizedPhone = normalizePhoneNumber(phone);
    const student = findStudentByPhone(normalizedPhone);

    if (!student) {
      return NextResponse.json(
        { error: "This phone number is not on the preregistered cohort roster." },
        { status: 404 },
      );
    }

    ensureAttempt(student.id);
    await createStudentSession(student.id, normalizedPhone);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid login request." },
      { status: 400 },
    );
  }
}
