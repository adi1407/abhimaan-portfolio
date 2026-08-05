"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/cn";

/* ================================================================== *
 * Hero wordmark — magnetic spotlight
 *
 * Related to the footer mark (cursor lights the name), but different:
 * letters spring toward the pointer, swell and lift when near, and a
 * soft accent spotlight trails the cursor with a light chromatic fringe.
 * No video, no ink beam.
 * ================================================================== */

const WORD = SITE.name.toUpperCase();

const REACH = 160;
const LIFT = 14;
const PUSH = 0.12;
const SCALE = 0.18;
const TILT = 8;
const SPRING = 0.18;
const DAMP = 0.78;
const POS_LERP = 0.14;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

type HeroWordmarkProps = {
  className?: string;
  ready?: boolean;
};

export function HeroWordmark({ className, ready = false }: HeroWordmarkProps) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLParagraphElement>(null);
  const lettersRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;

    const letters = lettersRef.current.filter(
      (el): el is HTMLSpanElement => el !== null,
    );
    if (letters.length === 0) return;

    const n = letters.length;
    const cx = new Float64Array(n);
    const cy = new Float64Array(n);
    const f = new Float64Array(n);
    const v = new Float64Array(n);

    let raf = 0;
    let active = false;
    let px = 0;
    let py = 0;
    let tx = 0;
    let ty = 0;
    let heat = 0;

    const measure = () => {
      for (const el of letters) el.style.transform = "";
      const box = root.getBoundingClientRect();
      letters.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        cx[i] = r.left - box.left + r.width / 2;
        cy[i] = r.top - box.top + r.height / 2;
      });
    };

    const clear = (el: HTMLSpanElement) => {
      el.style.transform = "";
      el.style.setProperty("--glow", "0");
      el.style.setProperty("--fringe", "0px");
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);

      px += (tx - px) * POS_LERP;
      py += (ty - py) * POS_LERP;
      heat += ((active ? 1 : 0) - heat) * 0.1;

      root.style.setProperty("--spot-x", `${px.toFixed(1)}px`);
      root.style.setProperty("--spot-y", `${py.toFixed(1)}px`);
      root.style.setProperty("--spot-a", heat.toFixed(3));

      let quiet = true;

      for (let i = 0; i < n; i += 1) {
        let target = 0;
        if (active) {
          const d = Math.hypot(cx[i] - px, cy[i] - py) || 1;
          const near = clamp(1 - d / REACH, 0, 1);
          target = near * near * (3 - 2 * near);
        }

        v[i] = (v[i] + (target - f[i]) * SPRING) * DAMP;
        f[i] += v[i];

        const el = letters[i];
        const a = f[i];

        if (!active && Math.abs(a) < 0.002 && Math.abs(v[i]) < 0.002) {
          if (f[i] !== 0) {
            f[i] = 0;
            v[i] = 0;
            clear(el);
          }
          continue;
        }

        quiet = false;
        const dx = cx[i] - px;
        const dy = cy[i] - py;
        const dist = Math.hypot(dx, dy) || 1;
        const ox = (dx / dist) * -PUSH * a * REACH * 0.35;
        const oy = -LIFT * a + (dy / dist) * -PUSH * a * 8;
        const sc = 1 + SCALE * a;
        const rot = clamp(dx / REACH, -1, 1) * -TILT * a;

        el.style.transform =
          `translate3d(${ox.toFixed(2)}px, ${oy.toFixed(2)}px, 0) ` +
          `scale(${sc.toFixed(3)}) rotate(${rot.toFixed(2)}deg)`;
        el.style.setProperty("--glow", a.toFixed(3));
        el.style.setProperty("--fringe", `${(a * 2.4).toFixed(2)}px`);
      }

      if (!active && quiet && heat < 0.02) {
        cancelAnimationFrame(raf);
        raf = 0;
        root.classList.remove("is-hot");
      }
    };

    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const point = (e: PointerEvent) => {
      const box = root.getBoundingClientRect();
      return { x: e.clientX - box.left, y: e.clientY - box.top };
    };

    const hoverOk = (e: PointerEvent) =>
      e.pointerType === "mouse" || e.pointerType === "pen";

    const onEnter = (e: PointerEvent) => {
      if (!hoverOk(e)) return;
      const p = point(e);
      active = true;
      tx = p.x;
      ty = p.y;
      if (!raf) {
        px = p.x;
        py = p.y;
      }
      root.classList.add("is-hot");
      start();
    };

    const onMove = (e: PointerEvent) => {
      if (!hoverOk(e)) return;
      if (!active) {
        onEnter(e);
        return;
      }
      const p = point(e);
      tx = p.x;
      ty = p.y;
    };

    const onLeave = () => {
      if (!active) return;
      active = false;
      start();
    };

    measure();
    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });

    const ro = new ResizeObserver(measure);
    ro.observe(root);

    root.addEventListener("pointerenter", onEnter);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointercancel", onLeave);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointercancel", onLeave);
      root.classList.remove("is-hot");
      letters.forEach(clear);
    };
  }, [reduced]);

  return (
    <p
      ref={rootRef}
      className={cn("ch__magnet", ready && "is-ready", className)}
      aria-hidden
    >
      <span className="ch__magnet-spot" />
      {WORD.split("").map((char, i) => (
        <span
          key={`${char}-${i}`}
          className="ch__magnet-cell"
          style={{ ["--i" as string]: i }}
        >
          <span
            className="ch__magnet-letter"
            ref={(el) => {
              lettersRef.current[i] = el;
            }}
          >
            {char}
          </span>
        </span>
      ))}
    </p>
  );
}
