"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";

/* ================================================================== *
 * Letter craft — bridge between cinema hero and the Photoshop poster.
 *
 * Light arrives from the hero exit: a flare opens the section, a beam
 * sweeps the type, then spacing settles into place.
 * ================================================================== */

const LINE = ["L", "E", "T", "T", "E", "R"];
const SUB = ["C", "R", "A", "F", "T"];

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

export function LetterCraft() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.22 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* Continuous arrival light — peaks as the section centres the fold.
     Deliberately NOT gated on reduced motion: this is a light level
     following scroll position, not an animation, and gating it left
     the lamp frozen at a fixed brightness for those users. */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      /* Proximity of the section's centre to the viewport's centre:
         0 while it is off-screen either way, 1 as it passes through
         the middle. Scrolling the page literally turns the lamp up
         and back down again. */
      const centre = rect.top + rect.height / 2;
      const reach = vh / 2 + rect.height / 2;
      const prox = clamp(1 - Math.abs(centre - vh / 2) / (reach || 1), 0, 1);

      /* Sharpened so the bright band sits around the middle of the
         pass rather than smearing across the whole scroll. */
      const lit = clamp((prox - 0.18) / 0.62, 0, 1);
      const eased = lit * lit * (3 - 2 * lit);

      el.style.setProperty("--arrive", eased.toFixed(4));
      /* Filament runs hotter and whiter than the spill it throws. */
      el.style.setProperty("--burn", (eased * eased).toFixed(4));
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className={cn("craft", inView && "is-in", reduced && "is-flat")}
      aria-labelledby="craft-title"
      style={{ ["--arrive" as string]: 0, ["--burn" as string]: 0 }}
    >
      {/* A hanging lamp is the only light in the room. Cord, shade,
          bulb, beam and dust all sway as one fixture; the pool it
          throws slides in sympathy underneath. */}
      <div className="craft__light" aria-hidden>
        <div className="craft__lamp">
          <span className="craft__cord" />
          <span className="craft__shade" />
          <span className="craft__halo" />
          <span className="craft__bulb" />
          <span className="craft__cone" />
          <span className="craft__dust" />
        </div>
        <span className="craft__pool" />
        <span className="craft__vignette" />
      </div>

      <div className="craft__grid" aria-hidden />

      <div className="craft__inner">
        <p className="craft__eyebrow">
          <span className="craft__tick" />
          Before the composite
        </p>

        <h2 id="craft-title" className="craft__title">
          <span className="craft__line" aria-hidden>
            {LINE.map((ch, i) => (
              <span
                key={`a-${i}`}
                className="craft__char"
                style={{ ["--i" as string]: i }}
              >
                {ch}
              </span>
            ))}
          </span>
          <span className="sr-only">Letter </span>
          <span className="craft__line craft__line--sub" aria-hidden>
            {SUB.map((ch, i) => (
              <span
                key={`b-${i}`}
                className="craft__char"
                style={{ ["--i" as string]: i + LINE.length }}
              >
                {ch}
              </span>
            ))}
          </span>
          <span className="sr-only">Craft</span>
        </h2>

        <p className="craft__lede">
          Spacing, weight, and hierarchy — the decisions that make a poster
          hold together before a single layer is drawn.
        </p>

        <ul className="craft__metrics" aria-hidden>
          <li>
            <em>Tracking</em>
            <span>−2 → optical</span>
          </li>
          <li>
            <em>Leading</em>
            <span>0.86 em</span>
          </li>
          <li>
            <em>Weight</em>
            <span>800 display</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
