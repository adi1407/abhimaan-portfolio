"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import {
  PT_COLLAPSE_MS,
  PT_EXPAND_MS,
  PT_HOLD_MS,
  useNav,
} from "@/components/layout/nav-provider";

/**
 * Click-origin circle wipe — same choreography as before, but filled with
 * page-tinted abstract fields (gradients, rings, grid) instead of poster images.
 */
export function PageTransition() {
  const { transition } = useNav();
  const [maxDim, setMaxDim] = useState(3000);

  useEffect(() => {
    const measure = () => {
      setMaxDim(Math.hypot(window.innerWidth, window.innerHeight) * 2.2);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const idle = transition.phase === "idle";
  const expanding =
    transition.phase === "expand" ||
    transition.phase === "label" ||
    transition.phase === "navigate" ||
    transition.phase === "hold";
  const collapsing = transition.phase === "collapse";
  const holding = transition.phase === "hold";

  const showMeta =
    transition.phase === "label" ||
    transition.phase === "navigate" ||
    transition.phase === "hold" ||
    transition.phase === "collapse";

  const exitMeta = transition.phase === "collapse";

  return (
    <div
      className={cn(
        "page-transition",
        idle && "is-idle",
        holding && "is-holding",
        collapsing && "is-leaving",
        `page-transition--${transition.theme}`,
      )}
      aria-hidden
      style={
        {
          ["--pt-expand" as string]: `${PT_EXPAND_MS}ms`,
          ["--pt-collapse" as string]: `${PT_COLLAPSE_MS}ms`,
          ["--pt-hold" as string]: `${PT_HOLD_MS}ms`,
          ["--pt-accent" as string]: transition.accent,
        } as CSSProperties
      }
    >
      <div
        key={`wipe-${transition.runId}`}
        className={cn(
          "page-transition__wipe",
          expanding && "is-expanding",
          collapsing && "is-collapsing",
        )}
        style={{
          left: transition.x,
          top: transition.y,
          width: maxDim,
          height: maxDim,
        }}
      >
        <div className="page-transition__field">
          <span className="page-transition__orb page-transition__orb--a" />
          <span className="page-transition__orb page-transition__orb--b" />
          <span className="page-transition__orb page-transition__orb--c" />
          <span className="page-transition__mesh" />
          <span className="page-transition__grid" />
          <span className="page-transition__ring" />
          <span className="page-transition__ring page-transition__ring--late" />
        </div>
        <div className="page-transition__scrim" />
        <div className="page-transition__grain" />
        <div className="page-transition__shine" />
      </div>

      <div
        className={cn(
          "page-transition__meta",
          showMeta && "is-visible",
          exitMeta && "is-exit",
        )}
      >
        {transition.index ? (
          <p className="page-transition__index">
            <span>Plate</span>
            <em>{transition.index}</em>
          </p>
        ) : null}
        <div className="page-transition__title">
          {transition.label.split("").map((char, i) => (
            <span
              key={`${transition.runId}-${char}-${i}`}
              style={{ ["--i" as string]: i }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </div>
        {transition.cue ? (
          <p className="page-transition__cue">
            <span>{transition.cue}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
