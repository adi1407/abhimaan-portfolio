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

  /* Continuous arrival light — peaks as the section centres the fold. */
  useEffect(() => {
    const el = rootRef.current;
    if (!el || reduced) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      /* 0 above fold → 1 when section top crosses ~35% of viewport. */
      const enter = clamp(1 - rect.top / (vh * 0.85), 0, 1);
      const mid = clamp(
        1 - Math.abs(rect.top + rect.height * 0.35 - vh * 0.45) / (vh * 0.7),
        0,
        1,
      );
      const arrive = clamp(enter * 0.55 + mid * 0.45, 0, 1);
      const eased = arrive * arrive * (3 - 2 * arrive);
      el.style.setProperty("--arrive", eased.toFixed(4));
      el.style.setProperty("--flare", (0.25 + eased * 0.9).toFixed(3));
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
  }, [reduced]);

  return (
    <section
      ref={rootRef}
      className={cn("craft", inView && "is-in", reduced && "is-flat")}
      aria-labelledby="craft-title"
      style={{ ["--arrive" as string]: 0 }}
    >
      {/* Light stack — inherits the hero’s exit glow */}
      <div className="craft__light" aria-hidden>
        <span className="craft__flare" />
        <span className="craft__aurora" />
        <span className="craft__beam" />
        <span className="craft__orb craft__orb--a" />
        <span className="craft__orb craft__orb--b" />
        <span className="craft__sweep" />
        <span className="craft__floor" />
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
