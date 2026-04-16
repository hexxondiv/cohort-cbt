import { NextResponse } from "next/server";
import { createAdminSession } from "@/lib/auth";
import { getRequestOrigin } from "@/lib/request-origin";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin";

function getStringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

async function redirectWithError(request: Request, message: string) {
  const url = new URL("/admin", await getRequestOrigin(request));
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const username = getStringValue(formData.get("username"));
  const password = getStringValue(formData.get("password"));

  if (!username || !password) {
    return redirectWithError(request, "Enter the admin username and password.");
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return redirectWithError(request, "Invalid admin credentials.");
  }

  await createAdminSession(username);

  const adminUrl = new URL("/admin", await getRequestOrigin(request));
  return NextResponse.redirect(adminUrl);
}
