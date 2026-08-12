"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ROUTES } from "@/lib/constants";
import { type WorkItem } from "@/lib/work";
import { useWorkItems } from "@/lib/cms/hooks";
import { cn } from "@/lib/cn";

/** Six tiles — posters first, then fill from remaining stills. */
function pickHeroPosters(items: WorkItem[]): WorkItem[] {
  const posters = items.filter((w) => w.category === "posters");
  const rest = items.filter((w) => w.category !== "posters");
  const seen = new Set<string>();
  const out: WorkItem[] = [];
  for (const item of [...posters, ...rest]) {
    if (seen.has(item.src)) continue;
    seen.add(item.src);
    out.push(item);
    if (out.length >= 6) break;
  }
  return out;
}

type PosterWallProps = {
  className?: string;
  /** When true, arm idle parallax / spotlight (after intro). */
  idle?: boolean;
};

export function PosterWall({ className, idle = false }: PosterWallProps) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const workItems = useWorkItems();
  const items = useMemo(() => pickHeroPosters(workItems), [workItems]);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const activeRef = useRef<number | null>(null);
  const idleRef = useRef(idle);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    idleRef.current = idle;
  }, [idle]);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), reduced ? 0 : 60);
    return () => window.clearTimeout(id);
  }, [reduced]);

  /* Spring pointer + Lenis-aware Ken Burns + spotlight. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;

    const tiles = Array.from(
      root.querySelectorAll<HTMLElement>("[data-poster-tile]"),
    );
    if (tiles.length === 0) return;

    let raf = 0;
    let onScreen = true;
    let px = 0;
    let py = 0;
    let vx = 0;
    let vy = 0;
    let tx = 0;
    let ty = 0;
    let scrollTarget = 0;
    let scrollCurrent = 0;

    const SPRING = 0.14;
    const DAMP = 0.72;
    const SCROLL_SPRING = 0.08;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = root.getBoundingClientRect();
      const x = (e.clientX - r.left) / Math.max(r.width, 1);
      const y = (e.clientY - r.top) / Math.max(r.height, 1);
      tx = x * 2 - 1;
      ty = y * 2 - 1;
      root.style.setProperty("--spot-x", `${(x * 100).toFixed(2)}%`);
      root.style.setProperty("--spot-y", `${(y * 100).toFixed(2)}%`);
    };

    const measureScroll = () => {
      const r = root.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // Soft handoff — ease out as hero leaves, cap zoom.
      const raw = Math.min(1, Math.max(0, -r.top / (vh * 0.72)));
      scrollTarget = raw * raw * (3 - 2 * raw);
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!onScreen) return;

      const armed = idleRef.current;

      if (armed) {
        vx += (tx - px) * SPRING;
        vy += (ty - py) * SPRING;
        vx *= DAMP;
        vy *= DAMP;
        px += vx;
        py += vy;
      } else {
        px += (0 - px) * 0.12;
        py += (0 - py) * 0.12;
        vx *= 0.85;
        vy *= 0.85;
      }

      scrollCurrent += (scrollTarget - scrollCurrent) * SCROLL_SPRING;
      const ken = 1 + scrollCurrent * 0.045;
      const liftY = scrollCurrent * -22;
      root.style.setProperty("--wall-scale", ken.toFixed(4));
      root.style.setProperty("--wall-y", `${liftY.toFixed(1)}px`);

      const hot = activeRef.current;

      tiles.forEach((tile, i) => {
        const depth = 0.5 + (i % 3) * 0.22;
        let ox = px * 14 * depth;
        let oy = py * 10 * depth;
        const rotX = -py * 5.5 * depth;
        const rotY = px * 6.5 * depth;

        if (hot !== null && hot !== i) {
          const away = 1.15;
          ox *= away;
          oy *= away;
        }

        const boost = hot === i ? 1 : 0;
        const scale = 1 + boost * 0.035;
        const z = boost * 28;

        tile.style.transform =
          `translate3d(${ox.toFixed(2)}px, ${oy.toFixed(2)}px, ${z.toFixed(1)}px) ` +
          `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) ` +
          `scale(${scale.toFixed(4)})`;
      });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
      },
      { rootMargin: "80px", threshold: 0.01 },
    );
    observer.observe(root);

    raf = requestAnimationFrame(tick);
    measureScroll();

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", measureScroll, { passive: true });

    const lenis = window.__lenis;
    const onLenis = () => measureScroll();
    lenis?.on("scroll", onLenis);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", measureScroll);
      lenis?.off("scroll", onLenis);
      root.style.removeProperty("--wall-scale");
      root.style.removeProperty("--wall-y");
      root.style.removeProperty("--spot-x");
      root.style.removeProperty("--spot-y");
      tiles.forEach((tile) => {
        tile.style.transform = "";
      });
    };
  }, [reduced, items.length]);

  const desktop = items;
  const mobile = items.slice(0, 2);

  return (
    <div
      ref={rootRef}
      className={cn(
        "poster-wall",
        ready && "is-ready",
        idle && "is-idle",
        className,
      )}
      aria-hidden
    >
      <div className="poster-wall__spot" />

      <div className="poster-wall__mosaic poster-wall__mosaic--desktop">
        {desktop.map((item, i) => (
          <Link
            key={item.id}
            href={ROUTES.work}
            className={cn(
              "poster-wall__tile",
              `poster-wall__tile--${i + 1}`,
              i === 1 && "poster-wall__tile--hero",
              active !== null && active !== i && "is-dim",
              active === i && "is-hot",
            )}
            data-poster-tile
            style={{ ["--i" as string]: i }}
            onPointerEnter={() => setActive(i)}
            onPointerLeave={() => setActive(null)}
            tabIndex={-1}
          >
            <span className="poster-wall__media">
              <Image
                src={item.src}
                alt=""
                fill
                sizes="(max-width: 900px) 100vw, 40vw"
                priority={i < 3}
                className="poster-wall__img"
              />
            </span>
          </Link>
        ))}
      </div>

      <div className="poster-wall__mosaic poster-wall__mosaic--mobile">
        {mobile.map((item, i) => (
          <Link
            key={item.id}
            href={ROUTES.work}
            className={cn(
              "poster-wall__tile",
              `poster-wall__tile--m${i + 1}`,
            )}
            style={{ ["--i" as string]: i }}
            tabIndex={-1}
          >
            <span className="poster-wall__media">
              <Image
                src={item.src}
                alt=""
                fill
                sizes="100vw"
                priority
                className="poster-wall__img"
              />
            </span>
          </Link>
        ))}
      </div>

      <div className="poster-wall__scrim" />
      <div className="poster-wall__grain" />
    </div>
  );
}
