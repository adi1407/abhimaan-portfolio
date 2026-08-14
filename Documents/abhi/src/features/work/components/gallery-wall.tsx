"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/cn";
import { type WorkCategoryId } from "@/lib/work";
import { ThumbCinema } from "@/features/work/components/thumb-cinema";
import { BookReader } from "@/features/work/components/book-reader";
import { useBook, useWorkCategories, useWorkItems } from "@/lib/cms/hooks";
import { useCms } from "@/lib/cms/provider";
import type { CmsWorkItem } from "@/lib/cms/types";

type Filter = "all" | WorkCategoryId;

type GalleryWallProps = {
  /** Deep-link from /work/[category] — pre-selects a filter. */
  initialCategory?: WorkCategoryId | null;
  /** Scroll this section into view when deep-linking. */
  focus?: boolean;
  /** Open the book reader as soon as Books is selected (film / deep-link). */
  autoOpenBook?: boolean;
};

const REEL_LEN = 5;
const REEL_MS = 3400;

/**
 * Deterministic per-index pseudo-random (never Math.random) so the server and
 * client agree and the scatter is identical across hydration.
 */
function noise(i: number, seed: number) {
  const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Where a tile flies in from. Tiles are thrown outward from the wall's centre
 * of gravity — left-hand pieces arrive from the left, right from the right —
 * with a random depth drop and rotation, so it reads as scattered rather than
 * mechanically alternating.
 */
function entrance(i: number) {
  const dir = noise(i, 1) < 0.5 ? -1 : 1;
  const x = Math.round(dir * (160 + noise(i, 2) * 220));
  const y = Math.round((noise(i, 3) - 0.35) * 260);
  const r = +(dir * (5 + noise(i, 4) * 9)).toFixed(1);
  return { x, y, r };
}

function Placeholder({ item }: { item: CmsWorkItem }) {
  return (
    <span
      className={cn("wall-ph", `wall-ph--${item.category}`)}
      aria-hidden
    >
      <span className="wall-ph__glyph">{item.title.slice(0, 1)}</span>
    </span>
  );
}

export function GalleryWall({
  initialCategory = null,
  focus = false,
  autoOpenBook = false,
}: GalleryWallProps) {
  const categories = useWorkCategories();
  const workItems = useWorkItems();
  const book = useBook();
  const filters: readonly { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    ...categories.map((c) => ({ id: c.id as Filter, label: c.short })),
  ];
  const [filter, setFilter] = useState<Filter>(initialCategory ?? "all");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [cinemaOrigin, setCinemaOrigin] = useState<HTMLElement | null>(null);
  const [bookOpen, setBookOpen] = useState(false);
  const bookAutoOpenedRef = useRef(false);

  // Follow a deep-link (/work/[category]) even if the route re-renders this
  // component without remounting — adjusted during render, not in an effect.
  const [prevInitial, setPrevInitial] = useState(initialCategory);
  if (initialCategory !== prevInitial) {
    setPrevInitial(initialCategory);
    setFilter(initialCategory ?? "all");
    setLightbox(null);
    setCinemaOrigin(null);
    setBookOpen(false);
  }

  const openAt = useCallback((i: number, el: HTMLElement | null) => {
    const media =
      el?.closest("button")?.querySelector<HTMLElement>(
        ".wall-item__media, .wall-thumbs__featured-media",
      ) ?? el;
    setCinemaOrigin(media);
    setLightbox(i);
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

  // Longer sets need a tighter wave or the tail drags.
  const stagger = visible.length > 8 ? 34 : 56;
  const isThumbs = filter === "thumbnails";
  const isBooks = filter === "books";
  const reel = useMemo(
    () => (isThumbs ? visible.slice(0, Math.min(REEL_LEN, visible.length)) : []),
    [isThumbs, visible],
  );
  const rest = useMemo(
    () => (isThumbs ? visible.slice(1) : visible),
    [isThumbs, visible],
  );

  const [reelIndex, setReelIndex] = useState(0);
  const [reelPaused, setReelPaused] = useState(false);
  const [thumbsLive, setThumbsLive] = useState(false);
  const featuredMediaRef = useRef<HTMLSpanElement>(null);
  const thumbsRootRef = useRef<HTMLDivElement>(null);
  const booksRootRef = useRef<HTMLDivElement>(null);

  // Reset reel when entering the thumbnails filter; close book when leaving Books.
  useEffect(() => {
    setReelIndex(0);
    setReelPaused(false);
    setThumbsLive(false);
    if (filter !== "books") {
      setBookOpen(false);
      bookAutoOpenedRef.current = false;
    }
  }, [filter]);

  // Film / /work/books → open the reader once per entry into Books.
  useEffect(() => {
    if (filter !== "books" || !autoOpenBook || bookAutoOpenedRef.current) return;
    bookAutoOpenedRef.current = true;
    const id = window.setTimeout(() => setBookOpen(true), 160);
    return () => window.clearTimeout(id);
  }, [filter, autoOpenBook]);

  // Featured reel auto-advance (paused on hover / reduced motion / lightbox).
  useEffect(() => {
    if (!isThumbs || reel.length < 2 || reelPaused || lightbox !== null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setReelIndex((i) => (i + 1) % reel.length);
    }, REEL_MS);
    return () => window.clearInterval(id);
  }, [isThumbs, reel.length, reelPaused, lightbox]);

  const onFeaturedPointer = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      const media = featuredMediaRef.current;
      if (!media) return;
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        return;
      }
      const r = media.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      media.style.setProperty("--tilt-x", `${(-py * 5).toFixed(2)}deg`);
      media.style.setProperty("--tilt-y", `${(px * 6).toFixed(2)}deg`);
      media.style.setProperty("--shine-x", `${((px + 0.5) * 100).toFixed(1)}%`);
      media.style.setProperty("--shine-y", `${((py + 0.5) * 100).toFixed(1)}%`);
    },
    [],
  );

  const onFeaturedLeave = useCallback(() => {
    const media = featuredMediaRef.current;
    if (!media) return;
    media.style.setProperty("--tilt-x", "0deg");
    media.style.setProperty("--tilt-y", "0deg");
  }, []);

  /**
   * Play the scatter-into-register entrance when the wall first comes into
   * view, and replay it whenever the filter changes (the grid remounts, so the
   * observer is re-attached and fires again immediately if already on screen).
   */
  const gridRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const grid = gridRef.current;
    const thumbsRoot = thumbsRootRef.current;
    const booksRoot = booksRootRef.current;
    const target = thumbsRoot ?? booksRoot ?? grid;
    if (!target) return;

    // The end state is the default; `is-cast` is what runs the animation. So a
    // missing observer or a dropped frame can never strand a tile off-stage.
    const cast = () => {
      grid?.classList.add("is-cast");
      setThumbsLive(true);
    };

    // Already on screen (landing straight on /work, or filtering in place)?
    // Cast synchronously — a CSS animation still plays from its 0% keyframe,
    // and this can't be stranded by a throttled frame callback.
    const rect = target.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      cast();
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      cast();
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        cast();
        io.disconnect();
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [filter]);

  const close = useCallback(() => {
    setLightbox(null);
    setCinemaOrigin(null);
    setBookOpen(false);
  }, []);
  const step = useCallback(
    (dir: 1 | -1) =>
      setLightbox((cur) =>
        cur === null ? cur : (cur + dir + visible.length) % visible.length,
      ),
    [visible.length],
  );

  // Keyboard control for the generic lightbox only (ThumbCinema / BookReader own keys).
  useEffect(() => {
    if (lightbox === null || isThumbs || isBooks) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox, isThumbs, isBooks, close, step]);

  /* GSAP page polish for thumbnails (desktop) — featured clip-in + grid stagger.
     CSS cast remains the fallback if GSAP is slow/unavailable. */
  useEffect(() => {
    if (!isThumbs || !thumbsLive) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(min-width: 900px)").matches) return;

    let cancelled = false;
    let ctx: { revert: () => void } | null = null;

    (async () => {
      const { gsap } = await import("gsap");
      if (cancelled) return;
      const root = thumbsRootRef.current;
      if (!root) return;

      ctx = gsap.context(() => {
        const feature = root.querySelector(".wall-thumbs__featured-media");
        const tiles = gsap.utils.toArray<HTMLElement>(
          root.querySelectorAll(".wall-item--thumb"),
        );

        if (feature) {
          gsap.fromTo(
            feature,
            { clipPath: "inset(10% 14% 10% 14% round 10px)", scale: 1.05 },
            {
              clipPath: "inset(0% 0% 0% 0% round 10px)",
              scale: 1,
              duration: 0.95,
              ease: "expo.out",
            },
          );
        }

        if (tiles.length) {
          gsap.set(tiles, { animation: "none" });
          gsap.fromTo(
            tiles,
            { y: 36, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.58,
              stagger: 0.04,
              ease: "power3.out",
              delay: 0.1,
              clearProps: "transform,animation",
            },
          );
        }
      }, root);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [isThumbs, thumbsLive, filter]);

  const profile = useCms().work.behance.profileUrl || null;
  const current = lightbox === null ? null : visible[lightbox];
  const currentCat = current
    ? categories.find((c) => c.id === current.category)
    : null;
  const featured = reel[reelIndex] ?? reel[0] ?? null;
  const featuredGlobalIndex = featured
    ? visible.findIndex((i) => i.id === featured.id)
    : 0;

  return (
    <section
      id="work"
      className={cn(
        "wall",
        isThumbs && "wall--thumbs",
        isBooks && "wall--books",
        isThumbs && thumbsLive && "is-thumbs-live",
      )}
      aria-label="Selected work"
    >
      <Container>
        <header className="wall__head" data-work-gallery-head>
          <div className="wall__head-lead">
            <p className="wall__eyebrow">
              {isThumbs
                ? "Thumbnails · scroll-stoppers"
                : isBooks
                  ? "Book design · spreads"
                  : "Selected work"}
            </p>
            <h2 className="wall__title">
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
                  <span className="wall__title-serif"> hung on one wall</span>
                </>
              )}
            </h2>
          </div>
          {profile ? (
            <a
              href={profile}
              className="wall__behance"
              target="_blank"
              rel="noreferrer noopener"
            >
              Full archive on Behance <span aria-hidden>↗</span>
            </a>
          ) : null}
        </header>

        <div className="wall__filters" role="tablist" aria-label="Filter work">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={cn("wall__chip", filter === f.id && "is-on")}
              onClick={() => {
                setFilter(f.id);
                setLightbox(null);
                setCinemaOrigin(null);
                setBookOpen(false);
              }}
            >
              {f.label}
              <span className="wall__chip-count">{counts[f.id]}</span>
            </button>
          ))}
        </div>

        {/* Clip the fly-in so off-stage tiles can never widen the page. */}
        <div className="wall__canvas">
          {isThumbs && featured ? (
            <div
              ref={thumbsRootRef}
              className={cn("wall-thumbs", thumbsLive && "is-live")}
            >
              <button
                type="button"
                className="wall-thumbs__featured"
                onClick={(e) =>
                  openAt(Math.max(0, featuredGlobalIndex), e.currentTarget)
                }
                onPointerMove={onFeaturedPointer}
                onPointerLeave={() => {
                  onFeaturedLeave();
                  setReelPaused(false);
                }}
                onPointerEnter={() => setReelPaused(true)}
                aria-label={`${featured.title}, ${featured.year} — open`}
              >
                <span
                  ref={featuredMediaRef}
                  className="wall-thumbs__featured-media"
                >
                  {reel.map((item, i) => (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={item.id}
                      src={item.src}
                      alt=""
                      className={cn(
                        "wall-thumbs__img",
                        i === reelIndex && "is-active",
                      )}
                      decoding="async" loading="lazy" />
                  ))}
                  <span className="wall-thumbs__shine" aria-hidden />
                  <span className="wall-thumbs__scan" aria-hidden />
                  <span className="wall-thumbs__play" aria-hidden>
                    ▶
                  </span>
                  <span
                    key={featured.id}
                    className="wall-thumbs__progress"
                    style={{ ["--reel-ms" as string]: `${REEL_MS}ms` }}
                    data-paused={
                      reelPaused || lightbox !== null ? "" : undefined
                    }
                    aria-hidden
                  />
                </span>
                <span className="wall-thumbs__featured-meta">
                  <span className="wall-thumbs__kicker">
                    Live reel · {String(reelIndex + 1).padStart(2, "0")} /{" "}
                    {String(reel.length).padStart(2, "0")}
                  </span>
                  <span
                    key={featured.id}
                    className="wall-thumbs__featured-title"
                  >
                    {featured.title}
                  </span>
                  <span className="wall-thumbs__featured-year">
                    {featured.year} · click to open
                  </span>
                  <span className="wall-thumbs__dots" aria-hidden>
                    {reel.map((item, i) => (
                      <span
                        key={item.id}
                        className={cn(
                          "wall-thumbs__dot",
                          i === reelIndex && "is-on",
                        )}
                      />
                    ))}
                  </span>
                </span>
              </button>

              <ul
                key={filter}
                ref={gridRef}
                className="wall__grid wall-thumbs__grid"
              >
                {rest.map((item, i) => {
                  const idx = i + 1;
                  const e = entrance(idx);
                  return (
                    <li
                      key={item.id}
                      className="wall-item wall-item--thumb"
                      style={
                        {
                          "--i": idx,
                          "--d": `${(80 + i * 42).toFixed(0)}ms`,
                          "--fx": `${e.x}px`,
                          "--fy": `${e.y}px`,
                          "--fr": `${e.r}deg`,
                        } as React.CSSProperties
                      }
                    >
                      <button
                        type="button"
                        className="wall-item__btn"
                        onClick={(e) => openAt(idx, e.currentTarget)}
                        aria-label={`${item.title}, ${item.year} — open`}
                      >
                        <span className="wall-item__media">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.src}
                            alt=""
                            className="wall-item__img"
                            loading="lazy"
                            decoding="async"
                          />
                          <span className="wall-item__shine" aria-hidden />
                          <span className="wall-item__play" aria-hidden>
                            ▶
                          </span>
                        </span>
                        <span className="wall-item__cap">
                          <span className="wall-item__name">{item.title}</span>
                          <span className="wall-item__year">{item.year}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : isBooks && visible[0] ? (
            <div ref={booksRootRef} className="wall-books">
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
                    decoding="async" loading="lazy" />
                  <span className="wall-books__open">Open book ↗</span>
                </span>
                <span className="wall-books__meta">
                  <span className="wall-books__kicker">{book?.subtitle}</span>
                  <span className="wall-books__title">{book?.title}</span>
                  <span className="wall-books__note">
                    {visible[0].year} · CSS page-turn reader — tap the cover
                    to flip through every spread.
                  </span>
                </span>
              </button>
            </div>
          ) : (
            <ul key={filter} ref={gridRef} className="wall__grid">
              {visible.map((item, i) => {
                const e = entrance(i);
                return (
                  <li
                    key={item.id}
                    className={cn("wall-item", `wall-item--${item.aspect}`)}
                    style={
                      {
                        "--i": i,
                        "--d": `${(i * stagger).toFixed(0)}ms`,
                        "--fx": `${e.x}px`,
                        "--fy": `${e.y}px`,
                        "--fr": `${e.r}deg`,
                      } as React.CSSProperties
                    }
                  >
                    <button
                      type="button"
                      className="wall-item__btn"
                      onClick={() => setLightbox(i)}
                      aria-label={`${item.title}, ${item.year} — open`}
                    >
                      <span className="wall-item__media">
                        {item.src ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={item.src}
                            alt=""
                            className="wall-item__img"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <Placeholder item={item} />
                        )}
                        <span className="wall-item__cat" aria-hidden>
                          {item.category}
                        </span>
                      </span>
                      <span className="wall-item__cap">
                        <span className="wall-item__name">{item.title}</span>
                        <span className="wall-item__year">{item.year}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Sits after the grid so the sibling selector can reach it. */}
          <span className="wall__register" aria-hidden />
        </div>
      </Container>

      {bookOpen ? <BookReader onClose={() => setBookOpen(false)} /> : null}

      {current && isThumbs && lightbox !== null ? (
        <ThumbCinema
          key={`tcinema-${filter}`}
          items={visible}
          index={lightbox}
          onIndexChange={setLightbox}
          onClose={close}
          originEl={cinemaOrigin}
        />
      ) : null}

      {current && !isThumbs && !isBooks ? (
        <div
          className="wall-lb"
          role="dialog"
          aria-modal="true"
          aria-label={current.title}
        >
          <button
            type="button"
            className="wall-lb__scrim"
            aria-label="Close"
            onClick={close}
          />

          <div className="wall-lb__panel">
            <div className="wall-lb__stage">
              {current.src ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={current.src} alt="" className="wall-lb__img" decoding="async" loading="lazy" />
              ) : (
                <Placeholder item={current} />
              )}
            </div>

            <div className="wall-lb__meta">
              <p className="wall-lb__cat">{currentCat?.label}</p>
              <h3 className="wall-lb__name">{current.title}</h3>
              <p className="wall-lb__year">{current.year}</p>
              {current.behanceUrl ? (
                <a
                  href={current.behanceUrl}
                  className="wall-lb__out"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  View on Behance ↗
                </a>
              ) : null}
              <p className="wall-lb__count">
                {String(lightbox! + 1).padStart(2, "0")} /{" "}
                {String(visible.length).padStart(2, "0")}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="wall-lb__nav wall-lb__nav--prev"
            aria-label="Previous"
            onClick={() => step(-1)}
          >
            ←
          </button>
          <button
            type="button"
            className="wall-lb__nav wall-lb__nav--next"
            aria-label="Next"
            onClick={() => step(1)}
          >
            →
          </button>
          <button
            type="button"
            className="wall-lb__close"
            aria-label="Close"
            onClick={close}
          >
            Close ✕
          </button>
        </div>
      ) : null}
    </section>
  );
}
