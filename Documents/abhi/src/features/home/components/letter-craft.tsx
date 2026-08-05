"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";

/* ================================================================== *
 * Letter craft — bridge between cinema hero and the Photoshop poster.
 *
 * A quiet typographic act: spacing, weight, and optical alignment settle
 * into place before the composite tools take over.
 * ================================================================== */

const LINE = ["L", "E", "T", "T", "E", "R"];
const SUB = ["C", "R", "A", "F", "T"];

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
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={rootRef}
      className={cn("craft", inView && "is-in", reduced && "is-flat")}
      aria-labelledby="craft-title"
    >
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
