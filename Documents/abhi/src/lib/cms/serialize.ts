import { mediaSrc } from "@/lib/supabase/server";

type MediaRow = { id: string } | null | undefined;

export function inquiryOut(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    createdAt: row.created_at ?? "",
    name: row.name,
    email: row.email,
    phone: row.phone ?? "",
    service: row.service,
    deliverable: row.deliverable ?? "",
    deadline: row.deadline ?? "",
    budget: row.budget ?? "",
    message: row.message,
    read: Boolean(row.read),
  };
}

export function workCategoryOut(row: Record<string, unknown>) {
  return {
    id: row.id,
    label: row.label,
    short: row.short,
    slot: row.slot,
    blurb: row.blurb,
    sort: row.sort,
    behanceUrl: row.behance_url ?? "",
  };
}

export function workItemOut(row: Record<string, unknown> & { media?: MediaRow }) {
  const mediaId = row.media_id ? String(row.media_id) : null;
  return {
    id: row.id,
    category: row.category_id,
    title: row.title,
    year: row.year,
    src: mediaSrc(mediaId),
    mediaId,
    aspect: row.aspect,
    sort: row.sort,
    behanceUrl: (row.behance_url as string) || null,
  };
}

export function campaignOut(
  row: Record<string, unknown> & {
    campaign_images?: Record<string, unknown>[];
  },
) {
  const images = [...(row.campaign_images ?? [])].sort(
    (a, b) => Number(a.sort ?? 0) - Number(b.sort ?? 0),
  );
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    cover: mediaSrc(row.cover_media_id ? String(row.cover_media_id) : null),
    coverMediaId: row.cover_media_id ? String(row.cover_media_id) : null,
    layout: row.layout,
    sort: row.sort,
    images: images.map((img) => ({
      id: (img.slug as string) || String(img.id),
      rowId: String(img.id),
      src: mediaSrc(img.media_id ? String(img.media_id) : null),
      mediaId: img.media_id ? String(img.media_id) : null,
      label: img.label,
      aspect: (img.aspect as string) || null,
      sort: img.sort,
    })),
  };
}

export function bookOut(
  row: Record<string, unknown> & { book_pages?: Record<string, unknown>[] },
) {
  const pages = [...(row.book_pages ?? [])].sort(
    (a, b) => Number(a.sort ?? 0) - Number(b.sort ?? 0),
  );
  const pagePayload = pages.map((p, i) => ({
    id: `page-${String(i + 1).padStart(2, "0")}`,
    rowId: String(p.id),
    src: mediaSrc(p.media_id ? String(p.media_id) : null),
    mediaId: p.media_id ? String(p.media_id) : null,
    label: (p.label as string) || `Page ${i + 1}`,
    sort: p.sort,
  }));
  const interiors = pagePayload.length > 1 ? pagePayload.slice(0, -1) : pagePayload;
  const spreads = [];
  for (let i = 0; i < interiors.length - 1; i += 2) {
    spreads.push({ left: interiors[i], right: interiors[i + 1] });
  }
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    cover:
      mediaSrc(row.cover_media_id ? String(row.cover_media_id) : null) ||
      pagePayload[0]?.src ||
      "",
    coverMediaId: row.cover_media_id ? String(row.cover_media_id) : null,
    pages: pagePayload,
    spreads,
    backCover: pagePayload.at(-1) ?? null,
    spreadCount: spreads.length,
  };
}
