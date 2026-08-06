"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SITE } from "@/lib/constants";
import { WORK_ITEMS } from "@/lib/work";
import { cn } from "@/lib/cn";

/* ================================================================== *
 * Hero wordmark — the name is a window onto the work.
 *
 * Two identical stacks of letters sit on top of each other: plain
 * white type, and the same type filled with a portfolio still. A soft
 * circular mask follows the cursor, so moving across the name wipes
 * the picture through the letterforms. The centre trails the pointer
 * slightly, which is what stops it feeling glued on.
 * ================================================================== */

const WORD = SITE.name.toUpperCase();

/** How much the window lags the pointer. Lower = heavier. */
const LERP = 0.18;

function artwork() {
  for (const item of WORK_ITEMS) if (item.src) return item.src;
  return "/work/p-01.jpg";
}

type HeroWordmarkProps = {
  className?: string;
  ready?: boolean;
};

export function HeroWordmark({ className, ready = false }: HeroWordmarkProps) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let raf = 0;
    let active = false;
    let tx = 0;
    let ty = 0;
    let px = 0;
    let py = 0;
    let primed = false;

    const write = () => {
      root.style.setProperty("--x", `${px.toFixed(1)}px`);
      root.style.setProperty("--y", `${py.toFixed(1)}px`);
    };

    const tick = () => {
      px += (tx - px) * LERP;
      py += (ty - py) * LERP;
      write();
      if (active && (Math.abs(tx - px) > 0.3 || Math.abs(ty - py) > 0.3)) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const at = (e: PointerEvent) => {
      const box = root.getBoundingClientRect();
      return { x: e.clientX - box.left, y: e.clientY - box.top };
    };

    /* Touch has no hover: a tap would light the window and strand it. */
    const hoverOk = (e: PointerEvent) =>
      e.pointerType === "mouse" || e.pointerType === "pen";

    const onEnter = (e: PointerEvent) => {
      if (!hoverOk(e)) return;
      const p = at(e);
      tx = p.x;
      ty = p.y;
      if (!primed) {
        /* Drop the window straight onto the pointer the first time so
           it fades up in place rather than sliding in from a corner. */
        px = p.x;
        py = p.y;
        primed = true;
        write();
      }
      active = true;
      root.classList.add("is-hot");
      if (reduced) {
        px = p.x;
        py = p.y;
        write();
      } else {
        start();
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!hoverOk(e)) return;
      if (!active) {
        onEnter(e);
        return;
      }
      const p = at(e);
      tx = p.x;
      ty = p.y;
      if (reduced) {
        px = p.x;
        py = p.y;
        write();
      } else {
        start();
      }
    };

    const onLeave = () => {
      active = false;
      primed = false;
      root.classList.remove("is-hot");
    };

    root.addEventListener("pointerenter", onEnter);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointercancel", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointercancel", onLeave);
      root.classList.remove("is-hot");
    };
  }, [reduced]);

  const letters = WORD.split("");

  return (
    <p
      ref={rootRef}
      className={cn("ch__wm", ready && "is-ready", className)}
      style={{ ["--wm-art" as string]: `url("${artwork()}")` }}
      aria-hidden
    >
      <span className="ch__wm-glow" />

      <span className="ch__wm-row ch__wm-row--base">
        {letters.map((char, i) => (
          <span
            key={`b-${char}-${i}`}
            className="ch__wm-cell"
            style={{ ["--i" as string]: i }}
          >
            <span>{char}</span>
          </span>
        ))}
      </span>

      {/* Same letters again, filled with the still and masked to the
          cursor. Identical markup keeps the two stacks in register. */}
      <span className="ch__wm-row ch__wm-row--art">
        {letters.map((char, i) => (
          <span key={`a-${char}-${i}`} className="ch__wm-cell">
            <span>{char}</span>
          </span>
        ))}
      </span>
    </p>
  );
}
