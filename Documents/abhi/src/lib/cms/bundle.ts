import { supabaseAdmin } from "@/lib/supabase/server";
import { bookOut, campaignOut, workCategoryOut, workItemOut } from "@/lib/cms/serialize";

export async function publicBundle() {
  const db = supabaseAdmin();
  const [
    pagesRes,
    catsRes,
    itemsRes,
    campsRes,
    bookRes,
  ] = await Promise.all([
    db.from("site_pages").select("key, body"),
    db.from("work_categories").select("*").order("sort").order("id"),
    db.from("work_items").select("*").order("sort").order("id"),
    db.from("campaigns").select("*, campaign_images(*)").order("sort").order("id"),
    db.from("books").select("*, book_pages(*)").limit(1),
  ]);

  const pages: Record<string, unknown> = {};
  for (const row of pagesRes.data ?? []) {
    pages[row.key as string] = row.body;
  }
  const cats = catsRes.data ?? [];
  const collections: Record<string, string> = {};
  for (const c of cats) {
    collections[c.id as string] = (c.behance_url as string) || "";
  }

  return {
    settings: pages.settings ?? {},
    home: pages.home ?? {},
    about: pages.about ?? {},
    contact: pages.contact ?? {},
    experience: pages.experience ?? {},
    footer: pages.footer ?? {},
    work: {
      categories: cats.map((c) => workCategoryOut(c)),
      items: (itemsRes.data ?? []).map((i) => workItemOut(i)),
      behance: {
        username: "abhishahi2",
        displayName: "Abhi Creates",
        profileUrl: "https://www.behance.net/abhishahi2",
        collections,
      },
    },
    campaigns: (campsRes.data ?? []).map((c) => campaignOut(c)),
    book: bookRes.data?.[0] ? bookOut(bookRes.data[0]) : null,
  };
}
