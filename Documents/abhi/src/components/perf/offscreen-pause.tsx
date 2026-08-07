"use client";

import { useEffect } from "react";

/* ================================================================== *
 * Off-screen pause
 *
 * Marquees, glows, pulses and drifts keep burning compositor work
 * even when their section is nowhere near the viewport — the browser
 * has no idea an animation is pointless. This watches the top-level
 * sections and marks the ones that are out of view, and the
 * stylesheet parks their animations.
 *
 * Purely a cost change: an animation you cannot see is paused, and it
 * resumes before the section scrolls back in.
 * ================================================================== */

/** Resume well before the edge so nothing is caught mid-park. */
const MARGIN = "300px 0px";

export function OffscreenPause() {
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;

    const sections = Array.from(main.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement,
    );

    /* The footer sits outside <main>, and its marquee is one of the
       few things that genuinely runs for the whole session. */
    const footer = document.querySelector("footer");
    if (footer instanceof HTMLElement) sections.push(footer);

    if (sections.length === 0) return;

    // A fixed overlay is never "off-screen" in any useful sense.
    const watched = sections.filter(
      (el) => getComputedStyle(el).position !== "fixed",
    );

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) el.removeAttribute("data-offscreen");
          else el.setAttribute("data-offscreen", "");
        }
      },
      { rootMargin: MARGIN },
    );

    for (const el of watched) io.observe(el);
    return () => io.disconnect();
  }, []);

  return null;
}
