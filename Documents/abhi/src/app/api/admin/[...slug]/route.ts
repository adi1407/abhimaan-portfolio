import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  requireAdmin,
  setSessionCookie,
  unauthorized,
  verifyPassword,
} from "@/lib/cms/auth-server";
import {
  bookOut,
  campaignOut,
  workCategoryOut,
  workItemOut,
} from "@/lib/cms/serialize";
import { proxyToFastApi } from "@/lib/cms/proxy";
import { mediaSrc, supabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";

function slugify(value: string) {
  const s = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return s || `item-${crypto.randomUUID().slice(0, 8)}`;
}

async function loadCampaign(id: string) {
  const { data } = await supabaseAdmin()
    .from("campaigns")
    .select("*, campaign_images(*)")
    .eq("id", id)
    .maybeSingle();
  return data;
}

async function loadBook() {
  const { data } = await supabaseAdmin()
    .from("books")
    .select("*, book_pages(*)")
    .limit(1)
    .maybeSingle();
  return data;
}

async function uploadToStorage(file: File, objectPath: string) {
  const db = supabaseAdmin();
  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await db.storage.from("media").upload(objectPath, buf, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });
  if (error) throw new Error(error.message);
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string[] }> },
) {
  if (!supabaseConfigured()) return proxyToFastApi(req);
  const slug = (await ctx.params).slug ?? [];
  return dispatch(req, slug, "GET");
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string[] }> },
) {
  if (!supabaseConfigured()) return proxyToFastApi(req);
  const slug = (await ctx.params).slug ?? [];
  return dispatch(req, slug, "POST");
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ slug: string[] }> },
) {
  if (!supabaseConfigured()) return proxyToFastApi(req);
  const slug = (await ctx.params).slug ?? [];
  return dispatch(req, slug, "PATCH");
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ slug: string[] }> },
) {
  if (!supabaseConfigured()) return proxyToFastApi(req);
  const slug = (await ctx.params).slug ?? [];
  return dispatch(req, slug, "PUT");
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ slug: string[] }> },
) {
  if (!supabaseConfigured()) return proxyToFastApi(req);
  const slug = (await ctx.params).slug ?? [];
  return dispatch(req, slug, "DELETE");
}

async function dispatch(req: Request, slug: string[], method: string) {
  const [a, b, c, d] = slug;
  const db = supabaseAdmin();

  if (a === "login" && method === "POST") {
    const body = (await req.json()) as { username?: string; password?: string };
    const username = (body.username ?? "").trim();
    const { data: user } = await db
      .from("admin_users")
      .select("username, password_hash")
      .eq("username", username)
      .maybeSingle();
    if (!user || !(await verifyPassword(body.password ?? "", user.password_hash))) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 },
      );
    }
    const res = NextResponse.json({ ok: true });
    setSessionCookie(res, user.username);
    return res;
  }

  if (a === "logout" && method === "POST") {
    const res = NextResponse.json({ ok: true });
    clearSessionCookie(res);
    return res;
  }

  if (a === "session" && method === "GET") {
    const user = await requireAdmin();
    return NextResponse.json({ authenticated: Boolean(user) });
  }

  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  if (a === "media" && method === "POST" && !b) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File required" }, { status: 400 });
    }
    const id = crypto.randomUUID();
    const ext = `.${(file.name.split(".").pop() || "bin").toLowerCase()}`;
    const path = `${id}${ext}`;
    await uploadToStorage(file, path);
    const { data, error } = await db
      .from("media")
      .insert({
        id,
        filename: file.name,
        mime: file.type || "application/octet-stream",
        path,
        alt: String(form.get("alt") ?? ""),
      })
      .select("*")
      .single();
    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Upload failed" }, { status: 500 });
    }
    return NextResponse.json({ id: data.id, src: mediaSrc(data.id), filename: data.filename });
  }

  if (a === "media" && b && method === "POST") {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File required" }, { status: 400 });
    }
    const { data: row } = await db.from("media").select("*").eq("id", b).maybeSingle();
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const ext = `.${(file.name.split(".").pop() || "bin").toLowerCase()}`;
    const path = `${b}${ext}`;
    await uploadToStorage(file, path);
    const { error } = await db
      .from("media")
      .update({ filename: file.name, mime: file.type || row.mime, path })
      .eq("id", b);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: b, src: mediaSrc(b), filename: file.name });
  }

  if (a === "work" && !b && method === "GET") {
    const [cats, items] = await Promise.all([
      db.from("work_categories").select("*").order("sort").order("id"),
      db.from("work_items").select("*").order("sort").order("id"),
    ]);
    return NextResponse.json({
      categories: (cats.data ?? []).map((row) => workCategoryOut(row)),
      items: (items.data ?? []).map((row) => workItemOut(row)),
    });
  }

  if (a === "work" && b === "categories" && method === "POST") {
    const body = (await req.json()) as Record<string, string | number>;
    const id = String(body.id || slugify(String(body.short || body.label || "cat")));
    const { count } = await db.from("work_categories").select("id", { count: "exact", head: true });
    const { data, error } = await db
      .from("work_categories")
      .insert({
        id,
        label: body.label,
        short: body.short,
        slot: body.slot ?? "tl",
        blurb: body.blurb ?? "",
        sort: body.sort ?? count ?? 0,
        behance_url: body.behanceUrl ?? "",
      })
      .select("*")
      .single();
    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Create failed" }, { status: 400 });
    }
    return NextResponse.json(workCategoryOut(data), { status: 201 });
  }

  if (a === "work" && b === "categories" && c && method === "PATCH") {
    const body = (await req.json()) as Record<string, string | number>;
    const patch: Record<string, unknown> = {
      label: body.label,
      short: body.short,
      slot: body.slot,
      blurb: body.blurb,
      behance_url: body.behanceUrl ?? "",
    };
    if (body.sort != null) patch.sort = body.sort;
    const { data, error } = await db
      .from("work_categories")
      .update(patch)
      .eq("id", c)
      .select("*")
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(workCategoryOut(data));
  }

  if (a === "work" && b === "categories" && c && method === "DELETE") {
    await db.from("work_items").delete().eq("category_id", c);
    await db.from("work_categories").delete().eq("id", c);
    return NextResponse.json({ ok: true });
  }

  if (a === "work" && b === "items" && method === "POST") {
    const body = (await req.json()) as Record<string, string | number | null>;
    let id = String(body.id || slugify(String(body.title || "work")));
    const existing = await db.from("work_items").select("id").eq("id", id).maybeSingle();
    if (existing.data) id = `${id}-${crypto.randomUUID().slice(0, 6)}`;
    const { count } = await db
      .from("work_items")
      .select("id", { count: "exact", head: true })
      .eq("category_id", body.category);
    const { data, error } = await db
      .from("work_items")
      .insert({
        id,
        category_id: body.category,
        title: body.title,
        year: body.year ?? "",
        aspect: body.aspect ?? "wide",
        sort: body.sort ?? count ?? 0,
        behance_url: body.behanceUrl ?? "",
        media_id: body.mediaId ?? null,
      })
      .select("*")
      .single();
    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Create failed" }, { status: 400 });
    }
    return NextResponse.json(workItemOut(data), { status: 201 });
  }

  if (a === "work" && b === "items" && c && method === "PATCH") {
    const body = (await req.json()) as Record<string, string | number | null>;
    const patch: Record<string, unknown> = {
      title: body.title,
      year: body.year,
      aspect: body.aspect,
      category_id: body.category,
      behance_url: body.behanceUrl ?? "",
    };
    if (body.sort != null) patch.sort = body.sort;
    if (body.mediaId !== undefined) patch.media_id = body.mediaId;
    const { data, error } = await db
      .from("work_items")
      .update(patch)
      .eq("id", c)
      .select("*")
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(workItemOut(data));
  }

  if (a === "work" && b === "items" && c && method === "DELETE") {
    await db.from("work_items").delete().eq("id", c);
    return NextResponse.json({ ok: true });
  }

  if (a === "campaigns" && !b && method === "GET") {
    const { data } = await db
      .from("campaigns")
      .select("*, campaign_images(*)")
      .order("sort");
    return NextResponse.json({ items: (data ?? []).map((row) => campaignOut(row)) });
  }

  if (a === "campaigns" && b && !c && method === "PATCH") {
    const body = (await req.json()) as Record<string, string | number | null>;
    const patch: Record<string, unknown> = {
      title: body.title,
      subtitle: body.subtitle,
      layout: body.layout,
    };
    if (body.sort != null) patch.sort = body.sort;
    if (body.coverMediaId !== undefined) patch.cover_media_id = body.coverMediaId;
    await db.from("campaigns").update(patch).eq("id", b);
    const camp = await loadCampaign(b);
    if (!camp) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(campaignOut(camp));
  }

  if (a === "campaigns" && b && c === "images" && !d && method === "POST") {
    const body = (await req.json()) as Record<string, string | number | null>;
    const camp = await loadCampaign(b);
    if (!camp) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await db.from("campaign_images").insert({
      campaign_id: b,
      media_id: body.mediaId ?? null,
      slug: body.slug || slugify(String(body.label || "image")),
      label: body.label ?? "",
      aspect: body.aspect ?? "",
      sort: body.sort ?? (camp.campaign_images?.length ?? 0),
    });
    return NextResponse.json(campaignOut((await loadCampaign(b))!), { status: 201 });
  }

  if (a === "campaigns" && b && c === "images" && d && method === "PATCH") {
    const body = (await req.json()) as Record<string, string | number | null>;
    const patch: Record<string, unknown> = {
      label: body.label,
      aspect: body.aspect ?? "",
    };
    if (body.sort != null) patch.sort = body.sort;
    if (body.mediaId !== undefined) patch.media_id = body.mediaId;
    if (body.slug) patch.slug = body.slug;
    await db.from("campaign_images").update(patch).eq("id", d).eq("campaign_id", b);
    return NextResponse.json(campaignOut((await loadCampaign(b))!));
  }

  if (a === "campaigns" && b && c === "images" && d && method === "DELETE") {
    await db.from("campaign_images").delete().eq("id", d).eq("campaign_id", b);
    return NextResponse.json({ ok: true });
  }

  if (a === "book" && !b && method === "GET") {
    const book = await loadBook();
    if (!book) return NextResponse.json({ error: "No book" }, { status: 404 });
    return NextResponse.json(bookOut(book));
  }

  if (a === "book" && !b && method === "PATCH") {
    const body = (await req.json()) as Record<string, string | null>;
    const book = await loadBook();
    if (!book) return NextResponse.json({ error: "No book" }, { status: 404 });
    const patch: Record<string, unknown> = {
      title: body.title,
      subtitle: body.subtitle,
    };
    if (body.coverMediaId !== undefined) patch.cover_media_id = body.coverMediaId;
    await db.from("books").update(patch).eq("id", book.id);
    return NextResponse.json(bookOut((await loadBook())!));
  }

  if (a === "book" && b === "pages" && !c && method === "POST") {
    const body = (await req.json()) as Record<string, string | number | null>;
    const book = await loadBook();
    if (!book) return NextResponse.json({ error: "No book" }, { status: 404 });
    const sort = body.sort ?? (book.book_pages?.length ?? 0);
    await db.from("book_pages").insert({
      book_id: book.id,
      media_id: body.mediaId ?? null,
      label: body.label || `Page ${Number(sort) + 1}`,
      sort,
    });
    return NextResponse.json(bookOut((await loadBook())!), { status: 201 });
  }

  if (a === "book" && b === "pages" && c && method === "PATCH") {
    const body = (await req.json()) as Record<string, string | number | null>;
    const patch: Record<string, unknown> = {};
    if (body.label) patch.label = body.label;
    if (body.sort != null) patch.sort = body.sort;
    if (body.mediaId !== undefined) patch.media_id = body.mediaId;
    await db.from("book_pages").update(patch).eq("id", c);
    return NextResponse.json(bookOut((await loadBook())!));
  }

  if (a === "book" && b === "pages" && c && method === "DELETE") {
    await db.from("book_pages").delete().eq("id", c);
    return NextResponse.json({ ok: true });
  }

  if (a === "pages" && b && method === "GET") {
    const { data } = await db.from("site_pages").select("key, body").eq("key", b).maybeSingle();
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ key: data.key, body: data.body });
  }

  if (a === "pages" && b && method === "PUT") {
    const body = (await req.json()) as { body?: unknown };
    const { data, error } = await db
      .from("site_pages")
      .upsert({ key: b, body: body.body ?? {} })
      .select("key, body")
      .single();
    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Save failed" }, { status: 500 });
    }
    return NextResponse.json({ key: data.key, body: data.body });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
