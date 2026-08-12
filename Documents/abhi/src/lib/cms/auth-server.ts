import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const COOKIE = "abhi_admin_session";

function secret() {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "replace-with-a-long-random-string";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(username: string) {
  const exp = Date.now() + 7 * 86400 * 1000;
  const payload = Buffer.from(JSON.stringify({ u: username, exp }), "utf8").toString(
    "base64url",
  );
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".", 2);
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      u?: string;
      exp?: number;
    };
    if (!data.u || !data.exp || data.exp < Date.now()) return null;
    return data.u;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: NextResponse, username: string) {
  res.cookies.set(COOKIE, createSessionToken(username), {
    httpOnly: true,
    sameSite: "lax",
    secure:
      process.env.COOKIE_SECURE === "true" || Boolean(process.env.VERCEL),
    path: "/",
    maxAge: 7 * 86400,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function verifyPassword(plain: string, hashed: string) {
  try {
    return await bcrypt.compare(plain, hashed);
  } catch {
    return false;
  }
}

export async function requireAdmin() {
  const jar = await cookies();
  const username = verifySessionToken(jar.get(COOKIE)?.value);
  if (!username) return null;
  const { data } = await supabaseAdmin()
    .from("admin_users")
    .select("username")
    .eq("username", username)
    .maybeSingle();
  return data?.username ?? null;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
