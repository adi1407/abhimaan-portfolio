"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ROUTES } from "@/lib/constants";
import { WORK_ITEMS } from "@/lib/work";
import { cn } from "@/lib/cn";

type Slot = {
  src: string;
  /** CSS class slot index 1–12 */
  slot: number;
  depth: number;
  mobile: boolean;
};

/** Build a dense field: unique images first, then reuse for fill. */
function buildSlots(): Slot[] {
  const unique: string[] = [];
  for (const item of WORK_ITEMS) {
    if (!unique.includes(item.src)) unique.push(item.src);
    if (unique.length >= 6) break;
  }
  // 12 desktop slots (6 unique × 2), first 6 also show on mobile
  const layouts: { slot: number; depth: number; mobile: boolean }[] = [
    { slot: 1, depth: 0.55, mobile: true },
    { slot: 2, depth: 0.9, mobile: true },
    { slot: 3, depth: 0.7, mobile: true },
    { slot: 4, depth: 1.1, mobile: true },
    { slot: 5, depth: 0.65, mobile: true },
    { slot: 6, depth: 0.85, mobile: true },
    { slot: 7, depth: 0.5, mobile: false },
    { slot: 8, depth: 1.05, mobile: false },
    { slot: 9, depth: 0.75, mobile: false },
    { slot: 10, depth: 0.95, mobile: false },
    { slot: 11, depth: 0.6, mobile: false },
    { slot: 12, depth: 0.8, mobile: false },
  ];

  return layouts.map((l, i) => ({
    src: unique[i % unique.length],
    slot: l.slot,
    depth: l.depth,
    mobile: l.mobile,
  }));
}

type HeroPosterFieldProps = {
  ready?: boolean;
  className?: string;
};

export function HeroPosterField({
  ready = false,
  className,
}: HeroPosterFieldProps) {
  const reduced = useReducedMotion();
  const slots = useMemo(() => buildSlots(), []);
  const rootRef = useRef<HTMLDivElement>(null);
  const [hot, setHot] = useState<number | null>(null);
  const hotRef = useRef<number | null>(null);

  useEffect(() => {
    hotRef.current = hot;
  }, [hot]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;

    const posters = Array.from(
      root.querySelectorAll<HTMLElement>("[data-poster]"),
    );
    if (posters.length === 0) return;

    let raf = 0;
    let onScreen = true;
    let px = 0;
    let py = 0;
    let vx = 0;
    let vy = 0;
    let tx = 0;
    let ty = 0;
    let inside = false;
    const t0 = performance.now();

    const SPRING = 0.1;
    const DAMP = 0.76;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = root.getBoundingClientRect();
      tx = ((e.clientX - r.left) / Math.max(r.width, 1) - 0.5) * 2;
      ty = ((e.clientY - r.top) / Math.max(r.height, 1) - 0.5) * 2;
      inside = true;

      // Nearest poster center → hot
      let best = -1;
      let bestD = Infinity;
      posters.forEach((el, i) => {
        const pr = el.getBoundingClientRect();
        const cx = pr.left + pr.width / 2;
        const cy = pr.top + pr.height / 2;
        const d = Math.hypot(e.clientX - cx, e.clientY - cy);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      const next = bestD < 180 ? best : null;
      if (hotRef.current !== next) {
        hotRef.current = next;
        setHot(next);
      }
    };

    const onLeave = () => {
      inside = false;
      tx = 0;
      ty = 0;
      hotRef.current = null;
      setHot(null);
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!onScreen) return;

      vx += (tx - px) * SPRING;
      vy += (ty - py) * SPRING;
      vx *= DAMP;
      vy *= DAMP;
      px += vx;
      py += vy;

      const t = (now - t0) * 0.001;
      const ambient = inside ? 0.25 : 1;

      posters.forEach((el, i) => {
        const depth = Number(el.dataset.depth) || 0.7;
        const driftX = Math.sin(t * 0.4 + i) * 5 * ambient * depth;
        const driftY = Math.cos(t * 0.35 + i * 0.7) * 4 * ambient * depth;
        // Parallax opposite cursor for depth feel
        const ox = -px * 22 * depth + driftX;
        const oy = -py * 16 * depth + driftY;
        const isHot = hotRef.current === i;
        const rot = (px * 4 + vx * 8) * depth * (isHot ? 1.4 : 0.6);
        const scale = isHot ? 1.08 : 1;

        el.style.transform =
          `translate3d(${ox.toFixed(2)}px, ${oy.toFixed(2)}px, 0) ` +
          `rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
      },
      { threshold: 0.05 },
    );
    observer.observe(root);

    const hero = root.closest(".hero") ?? root;
    hero.addEventListener("pointermove", onMove as EventListener, {
      passive: true,
    });
    hero.addEventListener("pointerleave", onLeave);

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      hero.removeEventListener("pointermove", onMove as EventListener);
      hero.removeEventListener("pointerleave", onLeave);
      posters.forEach((el) => {
        el.style.transform = "";
      });
    };
  }, [reduced, slots.length]);

  return (
    <div
      ref={rootRef}
      className={cn(
        "hero-field",
        ready && "is-ready",
        reduced && "is-static",
        className,
      )}
      aria-hidden
    >
      {slots.map((s, i) => (
        <Link
          key={`${s.slot}-${s.src}`}
          href={ROUTES.work}
          className={cn(
            "hero-field__poster",
            `hero-field__poster--${s.slot}`,
            s.mobile && "is-mobile",
            hot === i && "is-hot",
            hot !== null && hot !== i && "is-dim",
          )}
          data-poster
          data-depth={s.depth}
          style={{ ["--i" as string]: i }}
          tabIndex={-1}
        >
          <span className="hero-field__media">
            <Image
              src={s.src}
              alt=""
              fill
              sizes="(max-width: 900px) 40vw, 22vw"
              priority={i < 4}
              className="hero-field__img"
            />
          </span>
        </Link>
      ))}
    </div>
  );
}
