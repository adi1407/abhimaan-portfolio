import { NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/cms/auth-server";
import { proxyToFastApi } from "@/lib/cms/proxy";
import { inquiryOut } from "@/lib/cms/serialize";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!supabaseConfigured()) return proxyToFastApi(req);
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await ctx.params;
  const body = (await req.json()) as { read?: boolean };
  const { data, error } = await supabaseAdmin()
    .from("inquiries")
    .update({ read: body.read ?? true })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item: inquiryOut(data) });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!supabaseConfigured()) return proxyToFastApi(req);
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await ctx.params;
  const { error } = await supabaseAdmin().from("inquiries").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
