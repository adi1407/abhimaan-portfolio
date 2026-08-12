export type BookPage = {
  id: string;
  src: string;
  label: string;
};

export type BookSpread = {
  left: BookPage;
  right: BookPage;
};

export type Book = {
  id: string;
  title: string;
  subtitle: string;
  cover: string;
  pages: readonly BookPage[];
};

function page(n: number): BookPage {
  const id = `page-${String(n).padStart(2, "0")}`;
  return { id, src: `/book/${id}.webp`, label: `Page ${n}` };
}

/** Ordered pages — see public/book/manifest.json + npm run book:normalize */
export const BOOK: Book = {
  id: "quiet-hours-02",
  title: "Quiet Hours — Issue 02",
  subtitle: "Editorial · 14 × 22 cm",
  cover: "/book/page-01.webp",
  pages: Array.from({ length: 35 }, (_, i) => page(i + 1)),
};

export const BOOK_PAGE_COUNT = BOOK.pages.length;

/** Interior spreads: [01|02] … [33|34]. Page 35 is the back cover only. */
export const BOOK_SPREADS: readonly BookSpread[] = Array.from(
  { length: 17 },
  (_, i) => ({
    left: BOOK.pages[i * 2],
    right: BOOK.pages[i * 2 + 1],
  }),
);

export const BOOK_SPREAD_COUNT = BOOK_SPREADS.length;
export const BOOK_BACK_COVER = BOOK.pages[34];
export const BOOK_LAST_SPREAD = BOOK_SPREAD_COUNT - 1;
