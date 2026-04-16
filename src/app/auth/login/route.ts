import { NextResponse } from "next/server";
import { createStudentSession } from "@/lib/auth";
import { normalizePhoneNumber } from "@/lib/phone";
import { getRequestOrigin } from "@/lib/request-origin";
import { ensureAttempt, findStudentByPhone } from "@/lib/repository";

async function redirectWithError(request: Request, message: string) {
  const url = new URL("/", await getRequestOrigin(request));
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const phoneValue = formData.get("phone");

  if (typeof phoneValue !== "string" || phoneValue.trim().length < 5) {
    return redirectWithError(request, "Enter your registered phone number.");
  }

  try {
    const normalizedPhone = normalizePhoneNumber(phoneValue);
    const student = findStudentByPhone(normalizedPhone);

    if (!student) {
      return redirectWithError(request, "This phone number is not on the preregistered cohort roster.");
    }

    ensureAttempt(student.id);
    await createStudentSession(student.id, normalizedPhone);

    const assessmentUrl = new URL("/assessment", await getRequestOrigin(request));
    return NextResponse.redirect(assessmentUrl);
  } catch (error) {
    return redirectWithError(
      request,
      error instanceof Error ? error.message : "Unable to log you in.",
    );
  }
}
