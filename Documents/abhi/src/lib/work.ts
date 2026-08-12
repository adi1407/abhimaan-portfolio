export type WorkCategoryId = string;

export type WorkItem = {
  id: string;
  category: WorkCategoryId;
  title: string;
  year: string;
  /** Path under /public or CMS media URL */
  src: string;
  aspect: "portrait" | "square" | "wide" | string;
  /** Optional Behance project page — outbound only, not auto-fetched */
  behanceUrl?: string | null;
};

export type WorkCategory = {
  id: WorkCategoryId;
  label: string;
  short: string;
  slot: "tl" | "tr" | "bl" | "br";
  blurb: string;
};

/**
 * Behance bridge config — curated links, not a live API sync.
 * Fill collection URLs when ready.
 */
export const BEHANCE = {
  username: "abhishahi2",
  displayName: "Abhi Creates",
  profileUrl: "https://www.behance.net/abhishahi2",
  collections: {
    posters: "",
    thumbnails: "",
    logos: "",
    books: "",
  } as Record<string, string>,
};

export function isBehanceLinked() {
  return Boolean(BEHANCE.profileUrl || BEHANCE.username);
}

export function getBehanceProfileUrl() {
  if (BEHANCE.profileUrl) return BEHANCE.profileUrl;
  if (BEHANCE.username) return `https://www.behance.net/${BEHANCE.username}`;
  return null;
}

export function getBehanceCollectionUrl(id: WorkCategoryId) {
  const url = BEHANCE.collections[id];
  return url || null;
}

export function isWorkCategoryId(value: string): value is WorkCategoryId {
  return typeof value === "string" && value.length > 0 && value !== "all";
}
