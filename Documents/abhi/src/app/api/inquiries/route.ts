import { NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/cms/auth-server";
import { proxyToFastApi } from "@/lib/cms/proxy";
import { inquiryOut } from "@/lib/cms/serialize";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";

const SERVICES = new Set(["photoshop", "post", "both"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(req: Request) {
  if (!supabaseConfigured()) return proxyToFastApi(req);
  if (!(await requireAdmin())) return unauthorized();
  const { data, error } = await supabaseAdmin()
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: (data ?? []).map((row) => inquiryOut(row)) });
}

export async function POST(req: Request) {
  if (!supabaseConfigured()) return proxyToFastApi(req);
  const body = (await req.json()) as Record<string, string>;
  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
  }
  /* The public form asks for name, email and mobile only — service is no
     longer a required question, so an absent value defaults rather than
     rejecting the enquiry. An explicit value is still honoured. */
  const service = SERVICES.has(body.service) ? body.service : "both";
  const { data, error } = await supabaseAdmin()
    .from("inquiries")
    .insert({
      name: (body.name ?? "").trim().slice(0, 120),
      email: email.slice(0, 180),
      phone: (body.phone ?? "").slice(0, 40),
      service,
      deliverable: (body.deliverable ?? "").slice(0, 160),
      deadline: (body.deadline ?? "").slice(0, 80),
      budget: (body.budget ?? "").slice(0, 80),
      message: (body.message ?? "").trim().slice(0, 4000),
      read: false,
    })
    .select("id")
    .single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Save failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
