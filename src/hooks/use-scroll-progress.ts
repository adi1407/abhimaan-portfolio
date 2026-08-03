"use client";

import { useEffect, useRef } from "react";

type Options = {
  /**
   * Called with 0 → 1 as the element scrolls through its own extent.
   * Second arg is the tracked element so callers can write CSS vars without
   * racing a separate ref.
   */
  onProgress: (progress: number, element: HTMLElement) => void;
  /** Skip the listener entirely (unsupported layouts). */
  disabled?: boolean;
};

/**
 * Tracks how far a tall section has scrolled past a pinned viewport.
 * Progress is 0 while the section's top is at or below the viewport top, and
 * 1 once its bottom reaches the viewport bottom — the range a `sticky` child
 * stays pinned for.
 *
 * Listens to native window scroll/resize and Lenis (when it boots), since the
 * smooth-scroll layer can start after this hook mounts.
 */
export function useScrollProgress<T extends HTMLElement = HTMLElement>({
  onProgress,
  disabled = false,
}: Options) {
  const ref = useRef<T>(null);
  const callback = useRef(onProgress);
  const lastProgress = useRef(0);

  useEffect(() => {
    callback.current = onProgress;
  });

  useEffect(() => {
    if (disabled) return;

    let ticking = false;
    let lenisAttached = false;

    const measure = () => {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;

      // Avoid a one-frame flash to 1 while layout is still settling (height auto).
      if (travel <= 0) {
        callback.current(lastProgress.current, el);
        return;
      }

      const progress = Math.min(1, Math.max(0, -rect.top / travel));
      lastProgress.current = progress;
      callback.current(progress, el);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        measure();
        ticking = false;
      });
    };

    const attachLenis = () => {
      const lenis = window.__lenis;
      if (!lenis || lenisAttached) return;
      lenis.on("scroll", onScroll);
      lenisAttached = true;
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    attachLenis();

    const retryA = window.setTimeout(attachLenis, 0);
    const retryB = window.setTimeout(attachLenis, 120);

    let poll = 0;
    const tick = () => {
      const el = ref.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const near =
          rect.bottom > -200 && rect.top < window.innerHeight + 200;
        if (near) measure();
      }
      poll = requestAnimationFrame(tick);
    };
    poll = requestAnimationFrame(tick);

    return () => {
      window.clearTimeout(retryA);
      window.clearTimeout(retryB);
      cancelAnimationFrame(poll);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.__lenis?.off("scroll", onScroll);
    };
  }, [disabled]);

  return ref;
}
