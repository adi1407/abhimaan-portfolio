"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type RoleCycleProps = {
  roles: readonly string[];
  /** How long each role stays visible, in ms. */
  holdMs?: number;
  className?: string;
};

const EXIT_MS = 520;

/**
 * Cycles role labels with a per-character rise/exit. Always runs — intentional
 * hero motion, same policy as the lanyard drop (OS reduce-motion does not freeze it).
 */
export function RoleCycle({
  roles,
  holdMs = 2400,
  className,
}: RoleCycleProps) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    if (roles.length < 2) return;

    let cancelled = false;
    let holdTimer = 0;
    let outTimer = 0;

    const tick = () => {
      holdTimer = window.setTimeout(() => {
        if (cancelled) return;
        setPhase("out");
        outTimer = window.setTimeout(() => {
          if (cancelled) return;
          setIndex((i) => (i + 1) % roles.length);
          setPhase("in");
          tick();
        }, EXIT_MS);
      }, holdMs);
    };

    tick();

    return () => {
      cancelled = true;
      window.clearTimeout(holdTimer);
      window.clearTimeout(outTimer);
    };
  }, [holdMs, roles.length]);

  const current = roles[index] ?? roles[0];

  return (
    <span className={cn("role-cycle", className)} aria-live="polite">
      <span className="role-cycle__clip">
        <span
          key={`${index}-${phase}`}
          className={cn(
            "role-cycle__text",
            phase === "in" ? "is-in" : "is-out",
          )}
          aria-label={current}
        >
          {current.split("").map((char, i) => (
            <span
              key={`${i}-${char}`}
              className="role-cycle__char"
              style={{ ["--i" as string]: i }}
              aria-hidden
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </span>
      </span>
      <span className="role-cycle__measure" aria-hidden>
        {roles.reduce((a, b) => (a.length >= b.length ? a : b))}
      </span>
    </span>
  );
}
