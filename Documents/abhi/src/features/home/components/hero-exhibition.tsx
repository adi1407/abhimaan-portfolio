"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { type WorkItem } from "@/lib/work";
import { useWorkItems } from "@/lib/cms/hooks";
import { cn } from "@/lib/cn";

/** Unique stills for the exhibition (dedupe by src). */
export function pickExhibitionItems(items: WorkItem[], limit = 6): WorkItem[] {
  const seen = new Set<string>();
  const out: WorkItem[] = [];
  for (const item of items) {
    if (seen.has(item.src)) continue;
    seen.add(item.src);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

/** Rest offsets per layer — asymmetric gallery scatter. */
const LAYER_REST = [
  { x: -6, y: -4, r: -3 },
  { x: 8, y: 2, r: 2.5 },
  { x: -2, y: 10, r: -1.5 },
  { x: 12, y: -8, r: 4 },
  { x: -10, y: 6, r: -2 },
  { x: 4, y: -12, r: 1.5 },
] as const;

type HeroExhibitionProps = {
  active: number;
  ready?: boolean;
  className?: string;
  items?: WorkItem[];
};

export function HeroExhibition({
  active,
  ready = false,
  className,
  items: itemsProp,
}: HeroExhibitionProps) {
  const reduced = useReducedMotion();
  const workItems = useWorkItems();
  const items = useMemo(
    () => itemsProp ?? pickExhibitionItems(workItems, 6),
    [itemsProp, workItems],
  );
  const stageRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  /* Spring cursor follow + ambient drift on the stack. */
  useEffect(() => {
    const stage = stageRef.current;
    const stack = stackRef.current;
    if (!stage || !stack || reduced) return;

    let raf = 0;
    let onScreen = true;
    let px = 0;
    let py = 0;
    let vx = 0;
    let vy = 0;
    let tx = 0;
    let ty = 0;
    let hovering = false;
    const t0 = performance.now();

    const SPRING = 0.11;
    const DAMP = 0.78;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = stage.getBoundingClientRect();
      tx = ((e.clientX - r.left) / Math.max(r.width, 1) - 0.5) * 2;
      ty = ((e.clientY - r.top) / Math.max(r.height, 1) - 0.5) * 2;
      hovering = true;
    };

    const onLeave = () => {
      hovering = false;
      tx = 0;
      ty = 0;
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
      const ambient = hovering ? 0.15 : 1;
      const driftX = Math.sin(t * 0.45) * 6 * ambient;
      const driftY = Math.cos(t * 0.38) * 5 * ambient;

      const ox = px * 28 + driftX;
      const oy = py * 22 + driftY;
      const rotY = px * 7 + vx * 12;
      const rotX = -py * 6 - vy * 10;

      stack.style.transform =
        `translate3d(${ox.toFixed(2)}px, ${oy.toFixed(2)}px, 0) ` +
        `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
      },
      { threshold: 0.05 },
    );
    observer.observe(stage);

    raf = requestAnimationFrame(tick);
    stage.addEventListener("pointermove", onMove, { passive: true });
    stage.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      stack.style.transform = "";
    };
  }, [reduced]);

  return (
    <div
      ref={stageRef}
      className={cn(
        "hero-ex",
        ready && "is-ready",
        reduced && "is-static",
        className,
      )}
      aria-hidden
    >
      <div ref={stackRef} className="hero-ex__stack">
        {items.map((item, i) => {
          const rest = LAYER_REST[i % LAYER_REST.length];
          const isActive = i === active;
          return (
            <div
              key={item.id}
              className={cn(
                "hero-ex__layer",
                isActive ? "is-active" : "is-idle",
              )}
              style={{
                ["--i" as string]: i,
                ["--rest-x" as string]: `${rest.x}%`,
                ["--rest-y" as string]: `${rest.y}%`,
                ["--rest-r" as string]: `${rest.r}deg`,
                zIndex: isActive ? 20 : 10 - i,
              }}
            >
              <div className="hero-ex__frame">
                <Image
                  src={item.src}
                  alt=""
                  fill
                  sizes="(max-width: 900px) 90vw, 48vw"
                  priority={i < 2}
                  className="hero-ex__img"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
