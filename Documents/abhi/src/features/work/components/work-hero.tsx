"use client";

import { useEffect, useRef, useState } from "react";
import {
  WORK_CATEGORIES,
  getItemsByCategory,
  type WorkCategoryId,
} from "@/lib/work";

/* ================================================================== *
 * Work hero — an interactive exhibition index.
 *
 * Oversized editorial type listing the disciplines. Hovering a line
 * summons that discipline's stills as a stack of cards that FOLLOW the
 * cursor, each layer on its own easing rate so they trail apart into
 * real depth (the parallax that makes the motion read as weighty
 * rather than glued to the pointer). Horizontal velocity banks the
 * cards; when the pointer rests they drift on a slow ambient loop so
 * the section is never fully still.
 * ================================================================== */

/** Cards per stack. Layer 0 is frontmost and tracks the pointer hardest. */
const LAYERS = 3;
/** Per-layer follow rate (1/s). Lower = trails further behind = deeper. */
const FOLLOW_RATE = [11, 6.5, 4.2];
/** Per-layer resting offset, so the stack fans out instead of aligning. */
const LAYER_OFFSET = [
  { x: 0, y: 0 },
  { x: 26, y: -20 },
  { x: -22, y: 16 },
];
const LAYER_SCALE = [1, 0.94, 0.88];
/** Velocity → bank angle. */
const TILT_PER_VX = 0.055;
const TILT_MAX = 13;
const TILT_RATE = 7;
/** Reveal/hide easing for the whole stack. */
const SHOW_RATE = 9;

type Vec = { x: number; y: number };

export function WorkHero({
  onSelectCategory,
}: {
  onSelectCategory: (id: WorkCategoryId) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stackRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState<WorkCategoryId | null>(null);

  /** Read by the rAF loop without re-subscribing it. */
  const activeRef = useRef<WorkCategoryId | null>(null);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const target: Vec = { x: 0, y: 0 };
    const layers: (Vec & { tilt: number })[] = Array.from(
      { length: LAYERS },
      () => ({ x: 0, y: 0, tilt: 0 }),
    );
    let show = 0;
    let primed = false;
    let lastX = 0;
    let vx = 0;
    let raf = 0;
    let last = performance.now();

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      target.x = e.clientX - r.left;
      target.y = e.clientY - r.top;
      if (!primed) {
        // First sighting: drop the whole stack at the pointer so it
        // fades up in place instead of flying in from the corner.
        primed = true;
        for (const l of layers) {
          l.x = target.x;
          l.y = target.y;
        }
        lastX = target.x;
      }
    };
    host.addEventListener("pointermove", onMove, { passive: true });

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now * 0.001;

      // Pointer speed drives the bank angle.
      const frameVx = (target.x - lastX) / Math.max(dt, 1e-4);
      lastX = target.x;
      vx += (frameVx - vx) * Math.min(dt * 6, 1);

      const wanted = activeRef.current && primed ? 1 : 0;
      show += (wanted - show) * Math.min(dt * SHOW_RATE, 1);

      for (let i = 0; i < LAYERS; i++) {
        const l = layers[i];
        const k = Math.min(dt * FOLLOW_RATE[i], 1);
        l.x += (target.x - l.x) * k;
        l.y += (target.y - l.y) * k;

        const tiltWanted = Math.max(
          -TILT_MAX,
          Math.min(TILT_MAX, vx * TILT_PER_VX * (1 - i * 0.22)),
        );
        l.tilt += (tiltWanted - l.tilt) * Math.min(dt * TILT_RATE, 1);

        // Ambient breathing — automatic, so reduced motion opts out.
        const driftX = reduced ? 0 : Math.sin(t * 0.5 + i * 1.7) * (5 + i * 3);
        const driftY = reduced ? 0 : Math.cos(t * 0.38 + i * 2.1) * (6 + i * 3);

        const el = stackRefs.current[i];
        if (!el) continue;
        const s = LAYER_SCALE[i] * (0.86 + 0.14 * show);
        el.style.transform = `translate3d(${(
          l.x + LAYER_OFFSET[i].x + driftX
        ).toFixed(2)}px, ${(l.y + LAYER_OFFSET[i].y + driftY).toFixed(
          2,
        )}px, 0) translate(-50%, -50%) rotate(${l.tilt.toFixed(
          2,
        )}deg) scale(${s.toFixed(3)})`;
        // Deeper layers stay dimmer — that separation is what sells depth.
        el.style.opacity = (show * (1 - i * 0.26)).toFixed(3);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", onMove);
    };
  }, []);

  const activeItems = active ? getItemsByCategory(active) : [];

  return (
    <section
      ref={hostRef}
      className="wh"
      aria-label="Selected work"
      onPointerLeave={() => setActive(null)}
    >
      <div className="wh__grain" aria-hidden />

      {/* Cursor-trailing stack. One card per layer; the art swaps as the
          hovered discipline changes, so the cards never unmount. */}
      <div className="wh__stack" aria-hidden>
        {Array.from({ length: LAYERS }).map((_, i) => {
          const item = activeItems[i % Math.max(activeItems.length, 1)];
          return (
            <div
              key={i}
              ref={(el) => {
                stackRefs.current[i] = el;
              }}
              className="wh__card"
              style={{ zIndex: LAYERS - i }}
            >
              {item ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={item.src} alt="" draggable={false} />
              ) : null}
              <span className="wh__card-sheen" />
            </div>
          );
        })}
      </div>

      <div className="wh__inner">
        <header className="wh__head">
          <p className="wh__eyebrow">
            <span className="wh__pulse" aria-hidden />
            03 — Selected work
          </p>
          <h1 className="wh__title">
            The
            <span className="wh__title-serif"> archive</span>
          </h1>
          {/* Device-neutral wording — the stack is hover-only, so a
              "hover to preview" instruction would be dead copy on touch. */}
          <p className="wh__lede">
            Four disciplines, one practice. Look through the index, then open a
            wall.
          </p>
        </header>

        <ul className="wh__index">
          {WORK_CATEGORIES.map((cat, i) => {
            const items = getItemsByCategory(cat.id);
            const isActive = active === cat.id;
            const dim = active !== null && !isActive;
            return (
              <li
                key={cat.id}
                className={[
                  "wh__row",
                  isActive ? "is-active" : "",
                  dim ? "is-dim" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ ["--i" as string]: i }}
              >
                <button
                  type="button"
                  className="wh__row-btn"
                  onPointerEnter={() => setActive(cat.id)}
                  onFocus={() => setActive(cat.id)}
                  onBlur={() => setActive(null)}
                  onClick={() => onSelectCategory(cat.id)}
                >
                  <span className="wh__no" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="wh__label">{cat.short}</span>
                  <span className="wh__blurb">{cat.blurb}</span>
                  <span className="wh__count">
                    {items.length}
                    <em>pcs</em>
                  </span>
                  <span className="wh__go" aria-hidden>
                    ↗
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
