"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { forceReleaseScroll } from "@/lib/scroll-lock";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/**
 * Global smooth scroll. Everything else in the site reads plain
 * `window.scrollY`, so Lenis stays an enhancement rather than a dependency —
 * remove it and every animation still works.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
      // Nested overflow strips (studio filmstrip, etc.) must not swallow
      // vertical wheel — keep page scroll authoritative.
      syncTouch: true,
    });

    window.__lenis = lenis;

    // Keep scroll-driven CSS (poster, experience reel, etc.) in sync even if a
    // listener attached before Lenis finished booting.
    lenis.on("scroll", () => {
      window.dispatchEvent(new Event("scroll"));
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  // Route changes should land at the top instantly, not glide there.
  useEffect(() => {
    forceReleaseScroll();
    window.__lenis?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return <>{children}</>;
}
