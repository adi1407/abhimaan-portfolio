"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { Container } from "@/components/layout/container";
import { BookReader } from "@/features/work/components/book-reader";
import type { DomeGalleryImage } from "@/features/work/components/dome-gallery";
import { useBook, useWorkCategories, useWorkItems } from "@/lib/cms/hooks";
import { useCms } from "@/lib/cms/provider";
import { cn } from "@/lib/cn";
import { type WorkCategoryId } from "@/lib/work";

const DomeGallery = dynamic(
  () =>
    import("@/features/work/components/dome-gallery").then((m) => m.DomeGallery),
  { ssr: false },
);

type Filter = "all" | WorkCategoryId;

type WorkDomeGalleryProps = {
  initialCategory?: WorkCategoryId | null;
  focus?: boolean;
  autoOpenBook?: boolean;
};

export function WorkDomeGallery({
  initialCategory = null,
  focus = false,
  autoOpenBook = false,
}: WorkDomeGalleryProps) {
  const categories = useWorkCategories();
  const workItems = useWorkItems();
  const book = useBook();
  const profile = useCms().work.behance.profileUrl || null;

  const filters: readonly { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    ...categories.map((c) => ({ id: c.id as Filter, label: c.short })),
  ];

  const [filter, setFilter] = useState<Filter>(initialCategory ?? "all");
  const [bookOpen, setBookOpen] = useState(false);
  const bookAutoOpenedRef = useRef(false);
  const [mobile, setMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const [prevInitial, setPrevInitial] = useState(initialCategory);
  if (initialCategory !== prevInitial) {
    setPrevInitial(initialCategory);
    setFilter(initialCategory ?? "all");
    setBookOpen(false);
  }

  useEffect(() => {
    bookAutoOpenedRef.current = false;
  }, [initialCategory]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setMobile(mq.matches);
      setReducedMotion(rm.matches);
    };
    sync();
    mq.addEventListener("change", sync);
    rm.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      rm.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!focus) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(() => {
      document.getElementById("work")?.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
    }, 80);
    return () => window.clearTimeout(id);
  }, [focus, initialCategory]);

  const visible = useMemo(
    () =>
      filter === "all"
        ? workItems
        : workItems.filter((i) => i.category === filter),
    [filter, workItems],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: workItems.length };
    for (const c of categories) {
      map[c.id] = workItems.filter((i) => i.category === c.id).length;
    }
    return map;
  }, [categories, workItems]);

  const isBooks = filter === "books";
  const isThumbs = filter === "thumbnails";

  const domeImages = useMemo((): DomeGalleryImage[] => {
    if (isBooks) return [];
    return visible
      .filter((item) => item.src)
      .map((item) => ({
        src: item.src,
        alt: `${item.title} · ${item.year}`,
      }));
  }, [visible, isBooks]);

  useEffect(() => {
    if (filter !== "books" || !autoOpenBook || bookAutoOpenedRef.current) return;
    bookAutoOpenedRef.current = true;
    const id = window.setTimeout(() => setBookOpen(true), 160);
    return () => window.clearTimeout(id);
  }, [filter, autoOpenBook]);

  const featured = visible[0];

  return (
    <section
      id="work"
      className={cn("work-dome", isBooks && "work-dome--books")}
      aria-label="Selected work"
    >
      <Container>
        <header className="work-dome__head wall__head" data-work-gallery-head>
          <div className="wall__head-lead">
            <p className="work-dome__eyebrow wall__eyebrow">
              {isThumbs
                ? "Thumbnails · scroll-stoppers"
                : isBooks
                  ? "Book design · spreads"
                  : "Selected work"}
            </p>
            <h2 className="work-dome__title wall__title">
              {isThumbs ? (
                <>
                  Built to stop
                  <span className="wall__title-serif"> a scroll</span>
                </>
              ) : isBooks ? (
                <>
                  Open the
                  <span className="wall__title-serif"> book</span>
                </>
              ) : (
                <>
                  The work,
                  <span className="wall__title-serif"> in orbit</span>
                </>
              )}
            </h2>
          </div>
          {profile ? (
            <a
              href={profile}
              className="work-dome__behance wall__behance"
              target="_blank"
              rel="noreferrer noopener"
            >
              Full archive on Behance <span aria-hidden>↗</span>
            </a>
          ) : null}
        </header>

        <div
          className="work-dome__filters wall__filters"
          role="tablist"
          aria-label="Filter work"
        >
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={cn(
                "work-dome__chip wall__chip",
                filter === f.id && "is-on",
              )}
              onClick={() => {
                setFilter(f.id);
                setBookOpen(false);
                if (f.id !== "books") bookAutoOpenedRef.current = false;
              }}
            >
              {f.label}
              <span className="wall__chip-count">{counts[f.id]}</span>
            </button>
          ))}
        </div>

        {isBooks && featured ? (
          <div className="wall-books">
            <button
              type="button"
              className="wall-books__cover"
              onClick={() => setBookOpen(true)}
              aria-label={`${book?.title ?? "Book"} — open book reader`}
            >
              <span className="wall-books__media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={book?.cover ?? featured.src}
                  alt=""
                  className="wall-books__img"
                  decoding="async"
                  loading="lazy"
                />
                <span className="wall-books__open">Open book ↗</span>
              </span>
              <span className="wall-books__meta">
                <span className="wall-books__kicker">{book?.subtitle}</span>
                <span className="wall-books__title">{book?.title}</span>
                <span className="wall-books__note">
                  {featured.year} · CSS page-turn reader — tap the cover to flip
                  through every spread.
                </span>
              </span>
            </button>
          </div>
        ) : (
          <div className="work-dome__stage" aria-hidden={domeImages.length === 0}>
            {domeImages.length > 0 ? (
              <DomeGallery
                images={domeImages}
                fit={mobile ? 0.58 : 0.72}
                minRadius={mobile ? 420 : 560}
                segments={mobile ? 28 : 34}
                maxVerticalRotationDeg={reducedMotion ? 0 : 8}
                dragDampening={reducedMotion ? 1 : 2}
                overlayBlurColor="#0b1018"
                grayscale={false}
                imageBorderRadius="6px"
                openedImageBorderRadius="8px"
              />
            ) : (
              <p className="work-dome__empty">No pieces in this category yet.</p>
            )}
            <p className="work-dome__hint">
              Drag to rotate · tap a tile to enlarge
            </p>
          </div>
        )}
      </Container>

      {bookOpen ? <BookReader onClose={() => setBookOpen(false)} /> : null}
    </section>
  );
}
