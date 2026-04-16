import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { resetAllSubmissions } from "@/lib/repository";

export async function POST() {
  const adminSession = await getAdminSession();

  if (!adminSession || adminSession.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  resetAllSubmissions();
  return NextResponse.json({ ok: true });
}
