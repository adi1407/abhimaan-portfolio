import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/inquiries/auth";
import { createInquiry, listInquiries } from "@/lib/inquiries/store";
import type { InquiryService } from "@/lib/inquiries/types";

export const runtime = "nodejs";

const SERVICES = new Set<InquiryService>(["photoshop", "post", "both"]);

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await listInquiries();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const message = String(body.message ?? "").trim();
  const service = String(body.service ?? "") as InquiryService;

  if (name.length < 2) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!isEmail(email)) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }
  if (!SERVICES.has(service)) {
    return NextResponse.json(
      { error: "Choose Photoshop, Post, or Both." },
      { status: 400 },
    );
  }
  if (message.length < 8) {
    return NextResponse.json(
      { error: "Tell me a bit more about the project." },
      { status: 400 },
    );
  }

  const inquiry = await createInquiry({
    name,
    email,
    phone: String(body.phone ?? ""),
    service,
    deliverable: String(body.deliverable ?? ""),
    deadline: String(body.deadline ?? ""),
    budget: String(body.budget ?? ""),
    message,
  });

  return NextResponse.json({ ok: true, id: inquiry.id }, { status: 201 });
}
