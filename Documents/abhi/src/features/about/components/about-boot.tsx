"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const LINES = ["Creative profile", "Loading…", "Designer found."] as const;

/** Sub-second boot: a transition, never a loading screen. */
const STEP = 260;
const HOLD = 300;

/**
 * Opening act — a technical grid wakes, a short creative-system readout runs,
 * an electric scan line sweeps, then BEHIND THE PIXELS is unmasked.
 * Timers (not CSS keyframes) drive the sequence so it still completes under
 * prefers-reduced-motion, where it simply lands on the final state.
 */
export function AboutBoot() {
  const [step, setStep] = useState(-1);
  const [scanned, setScanned] = useState(false);
  const [titled, setTitled] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const t = timers.current;
    LINES.forEach((_, i) => {
      t.push(window.setTimeout(() => setStep(i), 120 + i * STEP));
    });
    t.push(window.setTimeout(() => setScanned(true), 120 + LINES.length * STEP));
    t.push(
      window.setTimeout(
        () => setTitled(true),
        120 + LINES.length * STEP + HOLD,
      ),
    );
    return () => {
      t.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
  }, []);

  return (
    <section className="ab-boot" aria-labelledby="about-title">
      <div className="ab-boot__grid" aria-hidden />

      {/* Creative-system readout */}
      <div className="ab-boot__readout" aria-hidden>
        {LINES.map((line, i) => (
          <p
            key={line}
            className={cn("ab-boot__line", step >= i && "is-on", i === 2 && "is-found")}
          >
            <span className="ab-boot__caret">›</span>
            {line}
          </p>
        ))}
      </div>

      {/* Electric scan */}
      <span className={cn("ab-boot__scan", scanned && "is-run")} aria-hidden />

      <div className="ab-boot__title-wrap">
        <h1
          id="about-title"
          className={cn("ab-boot__title", titled && "is-in")}
          aria-label="Behind the pixels"
        >
          {"Behind the pixels".split(" ").map((word, i) => (
            <span key={word} className="ab-boot__mask">
              <span
                className="ab-boot__word"
                style={{ ["--i" as string]: i }}
                aria-hidden
              >
                {word}
              </span>
            </span>
          ))}
        </h1>

        <p className={cn("ab-boot__sub", titled && "is-in")}>
          <span className="ab-boot__tick" aria-hidden />
          Art direction, identity &amp; visual systems — the thinking under the
          surface.
        </p>
      </div>

      <span className="ab-boot__coord ab-boot__coord--tl" aria-hidden>
        x 000 / y 000
      </span>
      <span className="ab-boot__coord ab-boot__coord--br" aria-hidden>
        About / 02
      </span>
    </section>
  );
}
