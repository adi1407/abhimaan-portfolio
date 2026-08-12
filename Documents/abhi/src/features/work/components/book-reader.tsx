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

export function BookReader({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [flip, setFlip] = useState<FlipDir>(null);
  const [nextArmed, setNextArmed] = useState(false);
  const [prevArmed, setPrevArmed] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const busy = flip !== null;

  const current = BOOK.pages[index];
  const nextPage = index < BOOK_PAGE_COUNT - 1 ? BOOK.pages[index + 1] : null;
  const prevPage = index > 0 ? BOOK.pages[index - 1] : null;

  useEffect(() => {
    setPortalReady(true);
    lockPageScroll();
    return () => unlockPageScroll();
  }, []);

  useEffect(() => {
    preloadAround(BOOK.pages, index);
  }, [index]);

  const finishFlip = useCallback(
    (dir: FlipDir) => {
      if (dir === "next") setIndex((i) => Math.min(i + 1, BOOK_PAGE_COUNT - 1));
      else if (dir === "prev") setIndex((i) => Math.max(i - 1, 0));
      setFlip(null);
      setNextArmed(false);
      setPrevArmed(false);
    },
    [],
  );

  const goNext = useCallback(() => {
    if (busy || index >= BOOK_PAGE_COUNT - 1) return;
    if (prefersReducedMotion()) {
      setIndex((i) => i + 1);
      return;
    }
    setNextArmed(false);
    setPrevArmed(false);
    setFlip("next");
    requestAnimationFrame(() => setNextArmed(true));
  }, [busy, index]);

  const goPrev = useCallback(() => {
    if (busy || index <= 0) return;
    if (prefersReducedMotion()) {
      setIndex((i) => i - 1);
      return;
    }
    setPrevArmed(false);
    setFlip("prev");
    requestAnimationFrame(() => setPrevArmed(true));
  }, [busy, index]);

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
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goNext, goPrev]);

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

  const underSrc =
    flip === "next" && nextPage
      ? nextPage.src
      : flip === "prev" && prevPage
        ? BOOK.pages[index].src
        : current.src;

  const leafSrc =
    flip === "next" ? current.src : flip === "prev" && prevPage ? prevPage.src : null;

  return createPortal(
    <div
      className="book is-open"
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
        <header className="book__chrome">
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
          <span className="book__edge book__edge--left" aria-hidden />
          <span className="book__edge book__edge--right" aria-hidden />

          <div className="book__stage">
            <div className="book__under">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={underSrc} alt="" className="book__spread" draggable={false} />
            </div>

            {leafSrc ? (
              <div
                className={cn(
                  "book__leaf",
                  flip === "next" && nextArmed && "is-turning-next",
                  flip === "prev" && "is-turning-prev",
                  flip === "prev" && prevArmed && "is-armed",
                )}
                onTransitionEnd={onLeafTransitionEnd}
              >
                <div className="book__face book__face--front">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={leafSrc} alt="" className="book__spread" draggable={false} />
                  <span className="book__shade" aria-hidden />
                </div>
                <div className="book__face book__face--back" aria-hidden>
                  <span className="book__paper" />
                </div>
              </div>
            ) : null}
          </div>

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
        </div>

        <footer className="book__foot">
          <button
            type="button"
            className="book__nav book__nav--prev"
            disabled={index <= 0 || busy}
            onClick={goPrev}
            aria-label="Previous spread"
          >
            ← Prev
          </button>
          <p className="book__hint">Tap edges or swipe to turn</p>
          <button
            type="button"
            className="book__nav book__nav--next"
            disabled={index >= BOOK_PAGE_COUNT - 1 || busy}
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
