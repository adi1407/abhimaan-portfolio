export type BookPage = {
  id: string;
  src: string;
  label: string;
};

export type Book = {
  id: string;
  title: string;
  subtitle: string;
  cover: string;
  pages: readonly BookPage[];
};

/** Ordered spreads — see public/book/manifest.json + npm run book:normalize */
export const BOOK: Book = {
  id: "quiet-hours-02",
  title: "Quiet Hours — Issue 02",
  subtitle: "Editorial spreads · 35 pages",
  cover: "/book/page-01.webp",
  pages: [
    { id: "page-01", src: "/book/page-01.webp", label: "Spread 1" },
    { id: "page-02", src: "/book/page-02.webp", label: "Spread 2" },
    { id: "page-03", src: "/book/page-03.webp", label: "Spread 3" },
    { id: "page-04", src: "/book/page-04.webp", label: "Spread 4" },
    { id: "page-05", src: "/book/page-05.webp", label: "Spread 5" },
    { id: "page-06", src: "/book/page-06.webp", label: "Spread 6" },
    { id: "page-07", src: "/book/page-07.webp", label: "Spread 7" },
    { id: "page-08", src: "/book/page-08.webp", label: "Spread 8" },
    { id: "page-09", src: "/book/page-09.webp", label: "Spread 9" },
    { id: "page-10", src: "/book/page-10.webp", label: "Spread 10" },
    { id: "page-11", src: "/book/page-11.webp", label: "Spread 11" },
    { id: "page-12", src: "/book/page-12.webp", label: "Spread 12" },
    { id: "page-13", src: "/book/page-13.webp", label: "Spread 13" },
    { id: "page-14", src: "/book/page-14.webp", label: "Spread 14" },
    { id: "page-15", src: "/book/page-15.webp", label: "Spread 15" },
    { id: "page-16", src: "/book/page-16.webp", label: "Spread 16" },
    { id: "page-17", src: "/book/page-17.webp", label: "Spread 17" },
    { id: "page-18", src: "/book/page-18.webp", label: "Spread 18" },
    { id: "page-19", src: "/book/page-19.webp", label: "Spread 19" },
    { id: "page-20", src: "/book/page-20.webp", label: "Spread 20" },
    { id: "page-21", src: "/book/page-21.webp", label: "Spread 21" },
    { id: "page-22", src: "/book/page-22.webp", label: "Spread 22" },
    { id: "page-23", src: "/book/page-23.webp", label: "Spread 23" },
    { id: "page-24", src: "/book/page-24.webp", label: "Spread 24" },
    { id: "page-25", src: "/book/page-25.webp", label: "Spread 25" },
    { id: "page-26", src: "/book/page-26.webp", label: "Spread 26" },
    { id: "page-27", src: "/book/page-27.webp", label: "Spread 27" },
    { id: "page-28", src: "/book/page-28.webp", label: "Spread 28" },
    { id: "page-29", src: "/book/page-29.webp", label: "Spread 29" },
    { id: "page-30", src: "/book/page-30.webp", label: "Spread 30" },
    { id: "page-31", src: "/book/page-31.webp", label: "Spread 31" },
    { id: "page-32", src: "/book/page-32.webp", label: "Spread 32" },
    { id: "page-33", src: "/book/page-33.webp", label: "Spread 33" },
    { id: "page-34", src: "/book/page-34.webp", label: "Spread 34" },
    { id: "page-35", src: "/book/page-35.webp", label: "Spread 35" },
  ],
} as const;

export const BOOK_PAGE_COUNT = BOOK.pages.length;
