export type WorkCategoryId = "posters" | "thumbnails" | "logos" | "books";

export type WorkItem = {
  id: string;
  category: WorkCategoryId;
  title: string;
  year: string;
  /** Path under /public (e.g. /thumbnails/… or /work/…) */
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

/** YouTube / reel covers — `public/thumbnails/*.webp` (see scripts/normalize-thumbnails.mjs). */
const T = {
  godlike: "/thumbnails/godlike-bgis.webp",
  carry: "/thumbnails/carry-fake-taxi.webp",
  ak: "/thumbnails/abhishek-kar.webp",
  akPod: "/thumbnails/abhishek-kar-podcast.webp",
  hydro: "/thumbnails/hydro.webp",
  manya: "/thumbnails/manya-bgmi.webp",
  jelly: "/thumbnails/jelly.webp",
  jellyAlt: "/thumbnails/jelly-alt.webp",
  jonny: "/thumbnails/jonny-live.webp",
  attanki: "/thumbnails/attanki-paaji.webp",
  mazy: "/thumbnails/mazy.webp",
  zap: "/thumbnails/zap.webp",
  gyan: "/thumbnails/gyan-therapy.webp",
  admino: "/thumbnails/admino-crate.webp",
  stream: "/thumbnails/stream-cut.webp",
  s01: "/thumbnails/series-01.webp",
  s02: "/thumbnails/series-02.webp",
  s03: "/thumbnails/series-03.webp",
  s04: "/thumbnails/series-04.webp",
  s07: "/thumbnails/series-07.webp",
  s08: "/thumbnails/series-08.webp",
  s09: "/thumbnails/series-09.webp",
  s10: "/thumbnails/series-10.webp",
} as const;

/** Work items — thumbnails first (featured order); other categories use /work stills. */
export const WORK_ITEMS: readonly WorkItem[] = [
  // Thumbnails — lead order drives film flipbook + channel featured tile
  {
    id: "th-01",
    category: "thumbnails",
    title: "GodLike BGIS",
    year: "2026",
    src: T.godlike,
    aspect: "wide",
  },
  {
    id: "th-02",
    category: "thumbnails",
    title: "Carry Fake Taxi",
    year: "2025",
    src: T.carry,
    aspect: "wide",
  },
  {
    id: "th-03",
    category: "thumbnails",
    title: "Abhishek Kar",
    year: "2025",
    src: T.ak,
    aspect: "wide",
  },
  {
    id: "th-04",
    category: "thumbnails",
    title: "Hydro",
    year: "2025",
    src: T.hydro,
    aspect: "wide",
  },
  {
    id: "th-05",
    category: "thumbnails",
    title: "Manya BGMI",
    year: "2025",
    src: T.manya,
    aspect: "wide",
  },
  {
    id: "th-06",
    category: "thumbnails",
    title: "Abhishek Kar Podcast",
    year: "2025",
    src: T.akPod,
    aspect: "wide",
  },
  {
    id: "th-07",
    category: "thumbnails",
    title: "Jelly",
    year: "2025",
    src: T.jelly,
    aspect: "wide",
  },
  {
    id: "th-08",
    category: "thumbnails",
    title: "Jelly Alt",
    year: "2025",
    src: T.jellyAlt,
    aspect: "wide",
  },
  {
    id: "th-09",
    category: "thumbnails",
    title: "Jonny Live",
    year: "2025",
    src: T.jonny,
    aspect: "wide",
  },
  {
    id: "th-10",
    category: "thumbnails",
    title: "Attanki Paaji",
    year: "2025",
    src: T.attanki,
    aspect: "wide",
  },
  {
    id: "th-11",
    category: "thumbnails",
    title: "Mazy",
    year: "2025",
    src: T.mazy,
    aspect: "wide",
  },
  {
    id: "th-12",
    category: "thumbnails",
    title: "Zap",
    year: "2025",
    src: T.zap,
    aspect: "wide",
  },
  {
    id: "th-13",
    category: "thumbnails",
    title: "Gyan Therapy",
    year: "2025",
    src: T.gyan,
    aspect: "wide",
  },
  {
    id: "th-14",
    category: "thumbnails",
    title: "Admino Crate",
    year: "2025",
    src: T.admino,
    aspect: "wide",
  },
  {
    id: "th-15",
    category: "thumbnails",
    title: "Stream Cut",
    year: "2025",
    src: T.stream,
    aspect: "wide",
  },
  {
    id: "th-16",
    category: "thumbnails",
    title: "Series 01",
    year: "2025",
    src: T.s01,
    aspect: "wide",
  },
  {
    id: "th-17",
    category: "thumbnails",
    title: "Series 02",
    year: "2025",
    src: T.s02,
    aspect: "wide",
  },
  {
    id: "th-18",
    category: "thumbnails",
    title: "Series 03",
    year: "2025",
    src: T.s03,
    aspect: "wide",
  },
  {
    id: "th-19",
    category: "thumbnails",
    title: "Series 04",
    year: "2025",
    src: T.s04,
    aspect: "wide",
  },
  {
    id: "th-20",
    category: "thumbnails",
    title: "Series 07",
    year: "2025",
    src: T.s07,
    aspect: "wide",
  },
  {
    id: "th-21",
    category: "thumbnails",
    title: "Series 08",
    year: "2025",
    src: T.s08,
    aspect: "wide",
  },
  {
    id: "th-22",
    category: "thumbnails",
    title: "Series 09",
    year: "2025",
    src: T.s09,
    aspect: "wide",
  },
  {
    id: "th-23",
    category: "thumbnails",
    title: "Series 10",
    year: "2025",
    src: T.s10,
    aspect: "wide",
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
  // Books — single cover opens the CSS page-flip reader (see BookReader)
  {
    id: "e01",
    category: "books",
    title: "Quiet Hours — Issue 02",
    year: "2026",
    src: "/book/page-01.webp",
    aspect: "wide",
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
