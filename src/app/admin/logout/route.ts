import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/auth";
import { getRequestOrigin } from "@/lib/request-origin";

export async function POST(request: Request) {
  await clearAdminSession();

  const adminUrl = new URL("/admin", await getRequestOrigin(request));
  return NextResponse.redirect(adminUrl);
}
