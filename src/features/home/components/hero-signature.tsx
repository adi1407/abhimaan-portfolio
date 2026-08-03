"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

const NAME = "Abhimaan";
const START = 340; // ms before the pen touches down
const WRITE = 1550; // ms to write the word
const FLOURISH = 560; // ms for the underline flourish

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

type HeroSignatureProps = {
  className?: string;
};

/**
 * "Abhimaan" written as a signature: the ink is wiped in left-to-right (as if
 * drawn), a pen nib rides the tip, then an underline flourish draws. Driven by
 * rAF writing CSS variables via refs — so it still animates under
 * prefers-reduced-motion (which only nukes CSS transitions/animations), with a
 * timeout fallback that guarantees the finished state.
 */
export function HeroSignature({ className }: HeroSignatureProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const inkRef = useRef<HTMLSpanElement>(null);
  const penRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let raf = 0;
    let start = 0;
    let done = false;

    const apply = (reveal: number, flourish: number, writing: boolean) => {
      root.style.setProperty("--reveal", reveal.toFixed(4));
      root.style.setProperty("--flourish", flourish.toFixed(4));
      root.classList.toggle("is-writing", writing);
      // Drive the wipe directly (not via a CSS var calc) so it can't be left
      // half-clipped by paint-recalc quirks.
      if (inkRef.current) {
        const right = ((1 - reveal) * 100).toFixed(2);
        inkRef.current.style.clipPath = `inset(-0.5em ${right}% -0.4em -0.12em)`;
      }
      if (penRef.current) {
        penRef.current.style.left = `${(reveal * 100).toFixed(2)}%`;
      }
    };

    const finish = () => {
      if (done) return;
      done = true;
      apply(1, 1, false);
      root.classList.remove("is-writing");
      root.classList.add("is-done");
    };

    const tick = (now: number) => {
      if (!start) start = now;
      const t = now - start - START;
      if (t < 0) {
        apply(0, 0, false);
        raf = requestAnimationFrame(tick);
        return;
      }
      const reveal = easeInOut(Math.min(1, t / WRITE));
      const flourish = Math.max(0, Math.min(1, (t - WRITE * 0.72) / FLOURISH));
      apply(reveal, flourish, reveal > 0.001 && reveal < 0.999);
      if (t >= WRITE + FLOURISH) {
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    // Guarantee the finished state even if rAF is throttled (background tab).
    const fallback = window.setTimeout(finish, START + WRITE + FLOURISH + 500);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <span
      ref={rootRef}
      className={cn("hero__signature", className)}
      aria-label={NAME}
    >
      <span ref={inkRef} className="hero__signature-ink" aria-hidden>
        {NAME}
      </span>

      <span ref={penRef} className="hero__signature-pen" aria-hidden />

      <svg
        className="hero__signature-stroke"
        viewBox="0 0 400 40"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          className="hero__signature-path"
          pathLength={1}
          d="M6 28 C 70 12, 140 34, 205 22 S 320 8, 394 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>

      <span className="hero__sheen" aria-hidden />
    </span>
  );
}
