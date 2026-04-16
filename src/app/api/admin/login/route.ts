import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSession } from "@/lib/auth";

const schema = z.object({
  username: z.string(),
  password: z.string(),
});

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin";

export async function POST(request: Request) {
  const { username, password } = schema.parse(await request.json());

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
  }

  await createAdminSession(username);
  return NextResponse.json({ ok: true });
}
