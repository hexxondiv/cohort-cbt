import crypto from "node:crypto";
import { cookies } from "next/headers";

const SESSION_SECRET = process.env.SESSION_SECRET ?? "educare-reentry-cbt-secret";
const STUDENT_COOKIE = "student_session";
const ADMIN_COOKIE = "admin_session";

type SessionPayload = {
  role: "student" | "admin";
  studentId?: number;
  phone?: string;
  username?: string;
  expiresAt: number;
};

function sign(value: string) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

function encode(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token?: string): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [body, signature] = token.split(".");

  if (!body || !signature || sign(body) !== signature) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (payload.expiresAt < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

async function setCookie(name: string, token: string) {
  const store = await cookies();
  store.set(name, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    expires: new Date(Date.now() + 1000 * 60 * 60 * 12),
  });
}

export async function createStudentSession(studentId: number, phone: string) {
  await setCookie(
    STUDENT_COOKIE,
    encode({
      role: "student",
      studentId,
      phone,
      expiresAt: Date.now() + 1000 * 60 * 60 * 12,
    }),
  );
}

export async function createAdminSession(username: string) {
  await setCookie(
    ADMIN_COOKIE,
    encode({
      role: "admin",
      username,
      expiresAt: Date.now() + 1000 * 60 * 60 * 12,
    }),
  );
}

export async function clearStudentSession() {
  const store = await cookies();
  store.delete(STUDENT_COOKIE);
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function getStudentSession() {
  const store = await cookies();
  return decode(store.get(STUDENT_COOKIE)?.value);
}

export async function getAdminSession() {
  const store = await cookies();
  return decode(store.get(ADMIN_COOKIE)?.value);
}
