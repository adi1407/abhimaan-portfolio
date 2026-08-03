"use client";

import { useEffect, useRef, useState } from "react";

type Options = {
  /** Fraction of the element that must be visible. */
  threshold?: number;
  /** Shrinks the viewport so reveals fire slightly before the edge. */
  rootMargin?: string;
  /** Stop observing after the first intersection. */
  once?: boolean;
};

/**
 * Returns a ref to attach and whether it has entered the viewport.
 * Falls back to `true` when IntersectionObserver is unavailable so
 * content is never left invisible.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>({
  threshold = 0.2,
  rootMargin = "0px 0px -12% 0px",
  once = true,
}: Options = {}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      // Reveal everything rather than leaving content stuck invisible.
      // Deferred a frame so this isn't a synchronous cascading render.
      const id = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(id);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, inView };
}
