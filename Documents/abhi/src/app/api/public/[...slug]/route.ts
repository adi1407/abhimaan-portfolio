import { NextResponse } from "next/server";
import { publicBundle } from "@/lib/cms/bundle";
import { proxyToFastApi } from "@/lib/cms/proxy";
import { supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string[] }> },
) {
  if (!supabaseConfigured()) return proxyToFastApi(req);
  const slug = (await ctx.params).slug ?? [];
  const [a, b] = slug;

  if (a === "bundle" && !b) {
    return NextResponse.json(await publicBundle());
  }
  if (a === "site" && !b) {
    const bundle = await publicBundle();
    return NextResponse.json({ settings: bundle.settings, footer: bundle.footer });
  }
  if (a === "work" && !b) {
    const bundle = await publicBundle();
    return NextResponse.json(bundle.work);
  }
  if (a === "campaigns" && !b) {
    const bundle = await publicBundle();
    return NextResponse.json({ items: bundle.campaigns });
  }
  if (a === "book" && !b) {
    const bundle = await publicBundle();
    if (!bundle.book) return NextResponse.json({ error: "No book" }, { status: 404 });
    return NextResponse.json(bundle.book);
  }
  if (a === "pages" && b) {
    const { data } = await supabaseAdmin()
      .from("site_pages")
      .select("key, body")
      .eq("key", b)
      .maybeSingle();
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ key: data.key, body: data.body });
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
