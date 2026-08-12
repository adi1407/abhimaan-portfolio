import { NextResponse } from "next/server";
import { proxyToFastApi } from "@/lib/cms/proxy";
import { mediaPublicUrl, supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!supabaseConfigured()) return proxyToFastApi(req);
  const { id } = await ctx.params;
  const { data } = await supabaseAdmin()
    .from("media")
    .select("path")
    .eq("id", id)
    .maybeSingle();
  if (!data?.path) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const target = String(data.path).startsWith("http")
    ? String(data.path)
    : mediaPublicUrl(String(data.path));
  return NextResponse.redirect(target, 302);
}
