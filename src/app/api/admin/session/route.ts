import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/inquiries/auth";

export const runtime = "nodejs";

export async function GET() {
  const ok = await isAdminAuthenticated();
  return NextResponse.json({ authenticated: ok });
}
