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
import { useBook } from "@/lib/cms/hooks";
import type { CmsBookPage } from "@/lib/cms/types";

type BookSpread = { left: CmsBookPage; right: CmsBookPage };

type Phase =
  | "closed"
  | "opening"
  | "ready"
  | "closing-back"
  | "back"
  | "opening-back";
type FlipDir = "next" | "prev" | null;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isPortraitViewport() {
  return window.matchMedia("(orientation: portrait)").matches;
}

async function tryLockLandscape() {
  try {
    const orient = screen.orientation as ScreenOrientation & {
      lock?: (orientation: string) => Promise<void>;
    };
    await orient.lock?.("landscape");
  } catch {
    /* iOS / unsupported — rotate gate handles UX */
  }
}

function tryUnlockOrientation() {
  try {
    screen.orientation?.unlock?.();
  } catch {
    /* ignore */
  }
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

function preloadAround(
  spreads: BookSpread[],
  backSrc: string,
  index: number,
) {
  for (const offset of [-2, -1, 0, 1, 2]) {
    const i = index + offset;
    if (i < 0 || i >= spreads.length) continue;
    const spread = spreads[i];
    const left = new Image();
    left.src = spread.left.src;
    const right = new Image();
    right.src = spread.right.src;
  }
  if (backSrc) {
    const back = new Image();
    back.src = backSrc;
  }
}

function PageFace({
  src,
  side,
  className,
}: {
  src: string;
  side: "left" | "right";
  className?: string;
}) {
  return (
    <div className={cn("book__page", `book__page--${side}`, className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="book__page-img" draggable={false} decoding="async" loading="lazy" />
    </div>
  );
}

function SpreadPair({
  spread,
  className,
}: {
  spread: BookSpread;
  className?: string;
}) {
  return (
    <div className={cn("book__spread-pair", className)}>
      <PageFace src={spread.left.src} side="left" />
      <PageFace src={spread.right.src} side="right" />
    </div>
  );
}

function CoverBlock({
  src,
  opening,
  side,
  onTransitionEnd,
}: {
  src: string;
  opening: boolean;
  side: "front" | "back";
  onTransitionEnd?: (e: TransitionEvent<HTMLDivElement>) => void;
}) {
  return (
    <div className={cn("book__cover-block", opening && "is-opening")}>
      <div
        className={cn(
          "book__cover-front",
          side === "back" && "book__cover-front--back",
        )}
        onTransitionEnd={onTransitionEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="book__cover-img" draggable={false} decoding="async" loading="lazy" />
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
  );
}

export function BookReader({ onClose }: { onClose: () => void }) {
  const book = useBook();
  const spreads = book?.spreads ?? [];
  const lastSpread = Math.max(spreads.length - 1, 0);
  const backSrc = book?.backCover?.src ?? "";
  const [phase, setPhase] = useState<Phase>(() =>
    typeof window !== "undefined" && prefersReducedMotion() ? "ready" : "closed",
  );
  const [index, setIndex] = useState(0);
  const [flip, setFlip] = useState<FlipDir>(null);
  const [flipArmed, setFlipArmed] = useState(false);
  const [portalReady] = useState(() => typeof document !== "undefined");
  const [portrait, setPortrait] = useState(() =>
    typeof window !== "undefined" ? isPortraitViewport() : false,
  );
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const flipLock = useRef(false);

  const busy =
    flip !== null ||
    phase === "opening" ||
    phase === "closing-back" ||
    phase === "opening-back";
  const ready = phase === "ready";
  const onBack = phase === "back";
  const gated = portrait;
  const current = spreads[index];
  const nextSpread =
    index < lastSpread ? spreads[index + 1] : null;
  const prevSpread = index > 0 ? spreads[index - 1] : null;
  const canPrev =
    !gated && !busy && (onBack || (ready && index > 0));
  const canNext =
    !gated && !busy && ready && spreads.length > 0 && index <= lastSpread;

  useEffect(() => {
    lockPageScroll();
    void tryLockLandscape();
    return () => {
      unlockPageScroll();
      tryUnlockOrientation();
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait)");
    const sync = () => setPortrait(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (phase !== "closed") return;
    const id = window.requestAnimationFrame(() => setPhase("opening"));
    return () => window.cancelAnimationFrame(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "opening" && phase !== "opening-back") return;
    const t = window.setTimeout(() => setPhase("ready"), 1100);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    preloadAround(spreads, backSrc, index);
  }, [index]);

  const beginOpening = useCallback(() => {
    if (phase !== "closed" || prefersReducedMotion()) return;
    setPhase("opening");
  }, [phase]);

  const onCoverTransitionEnd = useCallback(
    (e: TransitionEvent<HTMLDivElement>) => {
      if (e.propertyName !== "transform") return;
      if (phase === "opening") setPhase("ready");
      if (phase === "opening-back") setPhase("ready");
    },
    [phase],
  );

  const finishFlip = useCallback(
    (dir: FlipDir) => {
      if (flipLock.current) return;
      flipLock.current = true;
      if (dir === "next") {
        if (index >= lastSpread) {
          setPhase("back");
        } else {
          setIndex((i) => Math.min(i + 1, lastSpread));
        }
      } else if (dir === "prev") {
        setIndex((i) => Math.max(i - 1, 0));
      }
      setFlip(null);
      setFlipArmed(false);
    },
    [index, lastSpread],
  );

  useEffect(() => {
    if (!flipArmed || !flip) return;
    const t = window.setTimeout(() => finishFlip(flip), 1000);
    return () => window.clearTimeout(t);
  }, [flipArmed, flip, finishFlip]);

  const goNext = useCallback(() => {
    if (!canNext) return;
    if (prefersReducedMotion()) {
      if (index >= lastSpread) setPhase("back");
      else setIndex((i) => i + 1);
      return;
    }
    setFlipArmed(false);
    if (index >= lastSpread) setPhase("closing-back");
    setFlip("next");
    flipLock.current = false;
    requestAnimationFrame(() => setFlipArmed(true));
  }, [canNext, index, lastSpread]);

  const goPrev = useCallback(() => {
    if (!canPrev) return;
    if (onBack) {
      setIndex(lastSpread);
      if (prefersReducedMotion()) {
        setPhase("ready");
        return;
      }
      setPhase("opening-back");
      return;
    }
    if (prefersReducedMotion()) {
      setIndex((i) => i - 1);
      return;
    }
    setFlipArmed(false);
    setFlip("prev");
    flipLock.current = false;
    requestAnimationFrame(() => setFlipArmed(true));
  }, [canPrev, onBack]);

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
      else if (gated) return;
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Enter" && phase === "closed") beginOpening();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goNext, goPrev, phase, beginOpening, gated]);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (gated) return;
    const t = e.changedTouches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  }, [gated]);

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (gated) return;
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
    [goNext, goPrev, gated],
  );

  if (!portalReady || !book || !current) return null;

  const showFrontCover = phase === "closed" || phase === "opening";
  const showBackCover = phase === "back" || phase === "opening-back";
  const stageLive = ready || phase === "closing-back" || phase === "opening-back";
  const chromeLive = ready || onBack;
  const closingToBack = phase === "closing-back" || (flip === "next" && !nextSpread);

  const countLabel = onBack
    ? "Back"
    : showFrontCover
      ? "Cover"
      : `${String(index + 1).padStart(2, "0")} / ${String(spreads.length).padStart(2, "0")}`;

  const hint = onBack
    ? "Prev to reopen"
    : ready
      ? "Tap edges or swipe to turn"
      : phase === "opening-back"
        ? "Opening…"
        : "Opening…";

  const leafBackSrc = closingToBack
    ? backSrc
    : nextSpread
      ? nextSpread.left.src
      : null;
  const prevLeafBackSrc = prevSpread ? prevSpread.right.src : null;

  return createPortal(
    <div
      className={cn(
        "book",
        "is-open",
        phase === "opening" && "is-opening",
        ready && "is-ready",
        phase === "closing-back" && "is-closing-back",
        (onBack || phase === "opening-back") && "is-back",
        phase === "opening-back" && "is-opening-back",
        phase === "closed" && "is-closed",
        gated && "is-portrait-gate",
      )}
      role="dialog"
      aria-modal="true"
      aria-label={book?.title ?? "Book"}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        type="button"
        className="book__scrim"
        aria-label="Close book"
        onClick={onClose}
      />

      {gated ? (
        <div className="book__rotate" role="status">
          <span className="book__rotate-icon" aria-hidden />
          <p className="book__rotate-title">Rotate to landscape</p>
          <p className="book__rotate-copy">
            The book opens fullest sideways. Turn your device to keep reading.
          </p>
          <button
            type="button"
            className="book__rotate-close"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      ) : null}

      <div className="book__shell" aria-hidden={gated || undefined}>
        <header
          className={cn("book__chrome", !chromeLive && "book__chrome--locked")}
        >
          <div className="book__meta">
            <p className="book__eyebrow">{book?.subtitle}</p>
            <h2 className="book__title">{book?.title}</h2>
          </div>
          <p className="book__count">{countLabel}</p>
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
            {showFrontCover ? (
              <div className="book__cover-closed">
                <button
                  type="button"
                  className="book__cover-hit"
                  aria-label="Open book"
                  onClick={beginOpening}
                  disabled={phase === "opening"}
                >
                  <CoverBlock
                    src={book?.cover ?? ""}
                    opening={phase === "opening"}
                    side="front"
                    onTransitionEnd={onCoverTransitionEnd}
                  />
                  {phase === "closed" ? (
                    <span className="book__cover-cta">Open book</span>
                  ) : null}
                </button>
              </div>
            ) : null}

            {showBackCover ? (
              <div className="book__cover-closed book__cover-closed--back">
                <button
                  type="button"
                  className="book__cover-hit"
                  aria-label="Open last spread"
                  onClick={goPrev}
                  disabled={phase === "opening-back"}
                >
                  <CoverBlock
                    src={backSrc}
                    opening={phase === "opening-back"}
                    side="back"
                    onTransitionEnd={onCoverTransitionEnd}
                  />
                  {onBack ? (
                    <span className="book__cover-cta">Open last spread</span>
                  ) : null}
                </button>
              </div>
            ) : null}

            <div
              className={cn(
                "book__stage",
                showFrontCover && "book__stage--behind",
                stageLive && "book__stage--live",
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

              {flip === "next" && nextSpread ? (
                <SpreadPair
                  spread={nextSpread}
                  className="book__spread-under"
                />
              ) : flip === "next" && closingToBack ? (
                <div className="book__spread-under book__spread-under--close">
                  <PageFace src={current.left.src} side="left" />
                  <div className="book__page book__page--right book__page--void" />
                </div>
              ) : flip === "prev" && prevSpread ? (
                <SpreadPair
                  spread={prevSpread}
                  className="book__spread-under"
                />
              ) : null}

              {flip === "next" ? (
                <PageFace
                  src={current.left.src}
                  side="left"
                  className="book__pane book__pane--left"
                />
              ) : flip === "prev" ? (
                <PageFace
                  src={current.right.src}
                  side="right"
                  className="book__pane book__pane--right"
                />
              ) : (
                <>
                  <PageFace src={current.left.src} side="left" />
                  <PageFace src={current.right.src} side="right" />
                </>
              )}

              {flip === "next" && leafBackSrc ? (
                <div
                  className={cn(
                    "book__leaf",
                    "book__leaf--right",
                    flipArmed && "is-turning",
                  )}
                  onTransitionEnd={onLeafTransitionEnd}
                >
                  <div className="book__face book__face--front">
                    <PageFace src={current.right.src} side="right" />
                    <span className="book__shade book__shade--next" aria-hidden />
                  </div>
                  <div className="book__face book__face--back">
                    <PageFace src={leafBackSrc} side="left" />
                    <span className="book__shade book__shade--back" aria-hidden />
                  </div>
                </div>
              ) : null}

              {flip === "prev" && prevLeafBackSrc ? (
                <div
                  className={cn(
                    "book__leaf",
                    "book__leaf--left",
                    flipArmed && "is-turning",
                  )}
                  onTransitionEnd={onLeafTransitionEnd}
                >
                  <div className="book__face book__face--front">
                    <PageFace src={current.left.src} side="left" />
                    <span className="book__shade book__shade--prev" aria-hidden />
                  </div>
                  <div className="book__face book__face--back">
                    <PageFace src={prevLeafBackSrc} side="right" />
                    <span className="book__shade book__shade--back" aria-hidden />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {chromeLive ? (
            <div className="book__tap-zones" aria-hidden>
              <button
                type="button"
                className="book__zone book__zone--prev"
                tabIndex={-1}
                disabled={!canPrev}
                onClick={goPrev}
              />
              <button
                type="button"
                className="book__zone book__zone--next"
                tabIndex={-1}
                disabled={!canNext}
                onClick={goNext}
              />
            </div>
          ) : null}
        </div>

        <footer
          className={cn("book__foot", !chromeLive && "book__foot--locked")}
        >
          <button
            type="button"
            className="book__nav book__nav--prev"
            disabled={!canPrev}
            onClick={goPrev}
            aria-label="Previous pages"
          >
            ← Prev
          </button>
          <p className="book__hint">{hint}</p>
          <button
            type="button"
            className="book__nav book__nav--next"
            disabled={!canNext}
            onClick={goNext}
            aria-label="Next pages"
          >
            Next →
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
