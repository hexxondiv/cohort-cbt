import { NextResponse } from "next/server";
import { clearStudentSession } from "@/lib/auth";
import { getRequestOrigin } from "@/lib/request-origin";

export async function POST(request: Request) {
  await clearStudentSession();

  const homeUrl = new URL("/", await getRequestOrigin(request));
  return NextResponse.redirect(homeUrl);
}
