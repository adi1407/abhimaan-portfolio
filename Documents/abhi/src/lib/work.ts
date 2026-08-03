export type WorkCategoryId = "posters" | "thumbnails" | "logos" | "books";

export type WorkItem = {
  id: string;
  category: WorkCategoryId;
  title: string;
  year: string;
  /** Path under /public/work */
  src: string;
  aspect: "portrait" | "square" | "wide";
  /** Optional Behance project page — outbound only, not auto-fetched */
  behanceUrl?: string;
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
  } satisfies Record<WorkCategoryId, string>,
} as const;

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

export const WORK_CATEGORIES: readonly WorkCategory[] = [
  {
    id: "posters",
    label: "Poster design",
    short: "Posters",
    slot: "tl",
    blurb: "Big type, one idea, read from across the room.",
  },
  {
    id: "thumbnails",
    label: "Thumbnails & reel covers",
    short: "Thumbnails",
    slot: "tr",
    blurb: "Frames built to stop a scroll.",
  },
  {
    id: "logos",
    label: "Logo & design work",
    short: "Logos",
    slot: "bl",
    blurb: "Marks and systems that argue a position.",
  },
  {
    id: "books",
    label: "Book design",
    short: "Books",
    slot: "br",
    blurb: "Covers, spreads and grids with room to breathe.",
  },
] as const;

/** Project stills — `public/work/p-01.jpg` … `p-06.jpg`. */
const W = {
  p01: "/work/p-01.jpg",
  p02: "/work/p-02.jpg",
  p03: "/work/p-03.jpg",
  p04: "/work/p-04.jpg",
  p05: "/work/p-05.jpg",
  p06: "/work/p-06.jpg",
} as const;

/** Work items — wired to the uploaded project stills. */
export const WORK_ITEMS: readonly WorkItem[] = [
  // Thumbnails
  {
    id: "c01",
    category: "thumbnails",
    title: "GodLike BGIS — Creatives",
    year: "2026",
    src: W.p01,
    aspect: "wide",
    behanceUrl: "",
  },
  {
    id: "c02",
    category: "thumbnails",
    title: "Night Cut Thumbnail",
    year: "2025",
    src: W.p02,
    aspect: "portrait",
  },
  {
    id: "c03",
    category: "thumbnails",
    title: "Atlas Drop Cover",
    year: "2025",
    src: W.p03,
    aspect: "portrait",
  },
  {
    id: "c04",
    category: "thumbnails",
    title: "Signal Series 03",
    year: "2024",
    src: W.p04,
    aspect: "portrait",
  },
  // Posters
  {
    id: "p01",
    category: "posters",
    title: "Grid Study A",
    year: "2026",
    src: W.p05,
    aspect: "square",
  },
  {
    id: "p02",
    category: "posters",
    title: "Type Lockup Set",
    year: "2025",
    src: W.p06,
    aspect: "square",
  },
  {
    id: "p03",
    category: "posters",
    title: "Colour Field Pair",
    year: "2025",
    src: W.p01,
    aspect: "square",
  },
  {
    id: "p04",
    category: "posters",
    title: "Quiet Announcement",
    year: "2024",
    src: W.p02,
    aspect: "square",
  },
  // Logos
  {
    id: "b01",
    category: "logos",
    title: "Meridian Wordmark",
    year: "2026",
    src: W.p03,
    aspect: "wide",
  },
  {
    id: "b02",
    category: "logos",
    title: "Northline Symbol",
    year: "2025",
    src: W.p04,
    aspect: "square",
  },
  {
    id: "b03",
    category: "logos",
    title: "Atlas System Kit",
    year: "2025",
    src: W.p05,
    aspect: "wide",
  },
  {
    id: "b04",
    category: "logos",
    title: "Studio Seal",
    year: "2024",
    src: W.p06,
    aspect: "square",
  },
  // Books
  {
    id: "e01",
    category: "books",
    title: "Quiet Hours — Issue 02",
    year: "2026",
    src: W.p01,
    aspect: "wide",
  },
  {
    id: "e02",
    category: "books",
    title: "Spread: Margins",
    year: "2025",
    src: W.p02,
    aspect: "wide",
  },
  {
    id: "e03",
    category: "books",
    title: "Essay Layout",
    year: "2025",
    src: W.p03,
    aspect: "portrait",
  },
  {
    id: "e04",
    category: "books",
    title: "Colophon Study",
    year: "2024",
    src: W.p04,
    aspect: "square",
  },
] as const;

export function getCategory(id: WorkCategoryId) {
  return WORK_CATEGORIES.find((c) => c.id === id)!;
}

export function getItemsByCategory(id: WorkCategoryId) {
  return WORK_ITEMS.filter((item) => item.category === id);
}

export function isWorkCategoryId(value: string): value is WorkCategoryId {
  return WORK_CATEGORIES.some((c) => c.id === value);
}
