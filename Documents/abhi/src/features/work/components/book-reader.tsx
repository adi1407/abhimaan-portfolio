"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type TransitionEvent,
  type TouchEvent,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { BOOK, BOOK_PAGE_COUNT, type BookPage } from "@/lib/book";

type Phase = "closed" | "opening" | "ready";
type FlipDir = "next" | "prev" | null;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function lockPageScroll() {
  window.__lenis?.stop();
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
}

function unlockPageScroll() {
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  window.__lenis?.start();
}

function preloadAround(pages: readonly BookPage[], index: number) {
  for (const offset of [-2, -1, 0, 1, 2]) {
    const i = index + offset;
    if (i < 0 || i >= pages.length) continue;
    const img = new Image();
    img.src = pages[i].src;
  }
}

function SpreadHalf({
  src,
  side,
  className,
}: {
  src: string;
  side: "left" | "right";
  className?: string;
}) {
  return (
    <div className={cn("book__half", `book__half--${side}`, className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className={cn("book__spread-img", `book__spread-img--${side}`)}
        draggable={false}
      />
    </div>
  );
}

function SpreadFull({ src, className }: { src: string; className?: string }) {
  return (
    <div className={cn("book__spread-full", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="book__spread" draggable={false} />
    </div>
  );
}

export function BookReader({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>(() =>
    typeof window !== "undefined" && prefersReducedMotion() ? "ready" : "closed",
  );
  const [index, setIndex] = useState(0);
  const [flip, setFlip] = useState<FlipDir>(null);
  const [flipArmed, setFlipArmed] = useState(false);
  const [portalReady] = useState(() => typeof document !== "undefined");
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const busy = flip !== null;
  const ready = phase === "ready";
  const current = BOOK.pages[index];
  const nextPage = index < BOOK_PAGE_COUNT - 1 ? BOOK.pages[index + 1] : null;
  const prevPage = index > 0 ? BOOK.pages[index - 1] : null;

  useEffect(() => {
    lockPageScroll();
    return () => unlockPageScroll();
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (phase !== "closed") return;
    const id = window.requestAnimationFrame(() => setPhase("opening"));
    return () => window.cancelAnimationFrame(id);
  }, [phase]);

  useEffect(() => {
    preloadAround(BOOK.pages, index);
  }, [index]);

  const beginOpening = useCallback(() => {
    if (phase !== "closed" || prefersReducedMotion()) return;
    setPhase("opening");
  }, [phase]);

  const onCoverTransitionEnd = useCallback(
    (e: TransitionEvent<HTMLDivElement>) => {
      if (e.propertyName !== "transform" || phase !== "opening") return;
      setPhase("ready");
    },
    [phase],
  );

  const finishFlip = useCallback((dir: FlipDir) => {
    if (dir === "next") setIndex((i) => Math.min(i + 1, BOOK_PAGE_COUNT - 1));
    else if (dir === "prev") setIndex((i) => Math.max(i - 1, 0));
    setFlip(null);
    setFlipArmed(false);
  }, []);

  const goNext = useCallback(() => {
    if (!ready || busy || index >= BOOK_PAGE_COUNT - 1) return;
    if (prefersReducedMotion()) {
      setIndex((i) => i + 1);
      return;
    }
    setFlipArmed(false);
    setFlip("next");
    requestAnimationFrame(() => setFlipArmed(true));
  }, [ready, busy, index]);

  const goPrev = useCallback(() => {
    if (!ready || busy || index <= 0) return;
    if (prefersReducedMotion()) {
      setIndex((i) => i - 1);
      return;
    }
    setFlipArmed(false);
    setFlip("prev");
    requestAnimationFrame(() => setFlipArmed(true));
  }, [ready, busy, index]);

  const onLeafTransitionEnd = useCallback(
    (e: TransitionEvent<HTMLDivElement>) => {
      if (e.propertyName !== "transform" || !flip) return;
      finishFlip(flip);
    },
    [flip, finishFlip],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Enter" && phase === "closed") beginOpening();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goNext, goPrev, phase, beginOpening]);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const t = e.changedTouches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      const start = touchRef.current;
      touchRef.current = null;
      if (!start) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      if (dx < 0) goNext();
      else goPrev();
    },
    [goNext, goPrev],
  );

  if (!portalReady) return null;

  const showCover = phase !== "ready";
  const coverSrc = BOOK.cover;

  return createPortal(
    <div
      className={cn(
        "book",
        "is-open",
        phase === "opening" && "is-opening",
        ready && "is-ready",
      )}
      role="dialog"
      aria-modal="true"
      aria-label={BOOK.title}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        type="button"
        className="book__scrim"
        aria-label="Close book"
        onClick={onClose}
      />

      <div className="book__shell">
        <header
          className={cn("book__chrome", !ready && "book__chrome--locked")}
        >
          <div className="book__meta">
            <p className="book__eyebrow">{BOOK.subtitle}</p>
            <h2 className="book__title">{BOOK.title}</h2>
          </div>
          <p className="book__count">
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(BOOK_PAGE_COUNT).padStart(2, "0")}
          </p>
          <button
            type="button"
            className="book__close"
            aria-label="Close"
            onClick={onClose}
          >
            Close
          </button>
        </header>

        <div className="book__stage-wrap">
          <div className="book__book-tilt">
            {showCover ? (
              <div className="book__cover-closed">
                <button
                  type="button"
                  className="book__cover-hit"
                  aria-label="Open book"
                  onClick={beginOpening}
                  disabled={phase === "opening"}
                >
                  <div
                    className={cn(
                      "book__cover-block",
                      phase === "opening" && "is-opening",
                    )}
                  >
                    <div
                      className="book__cover-front"
                      onTransitionEnd={onCoverTransitionEnd}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverSrc}
                        alt=""
                        className="book__cover-img"
                        draggable={false}
                      />
                      <span className="book__cover-shine" aria-hidden />
                    </div>
                    <span className="book__cover-spine" aria-hidden />
                    <span className="book__cover-stack" aria-hidden>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <span
                          key={i}
                          className="book__stack-sheet"
                          style={{ ["--i" as string]: i }}
                        />
                      ))}
                    </span>
                  </div>
                  {phase === "closed" ? (
                    <span className="book__cover-cta">Open book</span>
                  ) : null}
                </button>
              </div>
            ) : null}

            <div
              className={cn(
                "book__stage",
                showCover && "book__stage--behind",
                ready && "book__stage--live",
              )}
            >
              <span className="book__spine" aria-hidden />

              <span className="book__stack" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className="book__stack-sheet"
                    style={{ ["--i" as string]: i }}
                  />
                ))}
              </span>

              {flip === "next" && nextPage ? (
                <SpreadFull src={nextPage.src} className="book__spread-under" />
              ) : flip === "prev" && prevPage ? (
                <SpreadFull src={prevPage.src} className="book__spread-under" />
              ) : null}

              {flip === "next" ? (
                <SpreadHalf
                  src={current.src}
                  side="left"
                  className="book__pane book__pane--left"
                />
              ) : flip === "prev" ? (
                <SpreadHalf
                  src={current.src}
                  side="right"
                  className="book__pane book__pane--right"
                />
              ) : (
                <>
                  <SpreadHalf src={current.src} side="left" />
                  <SpreadHalf src={current.src} side="right" />
                </>
              )}

              {flip === "next" ? (
                <div
                  className={cn(
                    "book__leaf",
                    "book__leaf--right",
                    flipArmed && "is-turning",
                  )}
                  onTransitionEnd={onLeafTransitionEnd}
                >
                  <div className="book__face book__face--front">
                    <SpreadHalf src={current.src} side="right" />
                    <span className="book__shade book__shade--next" aria-hidden />
                  </div>
                  <div className="book__face book__face--back" aria-hidden>
                    <span className="book__paper" />
                  </div>
                </div>
              ) : null}

              {flip === "prev" ? (
                <div
                  className={cn(
                    "book__leaf",
                    "book__leaf--left",
                    flipArmed && "is-turning",
                  )}
                  onTransitionEnd={onLeafTransitionEnd}
                >
                  <div className="book__face book__face--front">
                    <SpreadHalf src={current.src} side="left" />
                    <span className="book__shade book__shade--prev" aria-hidden />
                  </div>
                  <div className="book__face book__face--back" aria-hidden>
                    <span className="book__paper" />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {ready ? (
            <div className="book__tap-zones" aria-hidden>
              <button
                type="button"
                className="book__zone book__zone--prev"
                tabIndex={-1}
                disabled={index <= 0 || busy}
                onClick={goPrev}
              />
              <button
                type="button"
                className="book__zone book__zone--next"
                tabIndex={-1}
                disabled={index >= BOOK_PAGE_COUNT - 1 || busy}
                onClick={goNext}
              />
            </div>
          ) : null}
        </div>

        <footer
          className={cn("book__foot", !ready && "book__foot--locked")}
        >
          <button
            type="button"
            className="book__nav book__nav--prev"
            disabled={!ready || index <= 0 || busy}
            onClick={goPrev}
            aria-label="Previous spread"
          >
            ← Prev
          </button>
          <p className="book__hint">
            {ready ? "Tap edges or swipe to turn" : "Opening…"}
          </p>
          <button
            type="button"
            className="book__nav book__nav--next"
            disabled={!ready || index >= BOOK_PAGE_COUNT - 1 || busy}
            onClick={goNext}
            aria-label="Next spread"
          >
            Next →
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
