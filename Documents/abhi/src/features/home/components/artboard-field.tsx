"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ROUTES } from "@/lib/constants";
import { useWorkItems } from "@/lib/cms/hooks";
import { cn } from "@/lib/cn";

type Slot = {
  src: string;
  slot: number;
  depth: number;
  mobile: boolean;
  restRot: number;
  label: string;
  opacity: number;
};

function buildSlots(items: { src: string }[]): Slot[] {
  const unique: string[] = [];
  for (const item of items) {
    if (!unique.includes(item.src)) unique.push(item.src);
    if (unique.length >= 6) break;
  }

  const layouts: Omit<Slot, "src">[] = [
    { slot: 1, depth: 0.45, mobile: true, restRot: -8, label: "Layer 01", opacity: 100 },
    { slot: 2, depth: 1.1, mobile: true, restRot: 6, label: "Layer 02", opacity: 92 },
    { slot: 3, depth: 0.7, mobile: true, restRot: 3, label: "Layer 03", opacity: 88 },
    { slot: 4, depth: 1.05, mobile: true, restRot: -5, label: "Layer 04", opacity: 96 },
    { slot: 5, depth: 0.55, mobile: true, restRot: 7, label: "Layer 05", opacity: 85 },
    { slot: 6, depth: 0.9, mobile: false, restRot: -4, label: "Layer 06", opacity: 90 },
    { slot: 7, depth: 0.35, mobile: false, restRot: -2, label: "Layer 07", opacity: 78 },
    { slot: 8, depth: 1.2, mobile: false, restRot: 5, label: "Layer 08", opacity: 100 },
    { slot: 9, depth: 0.6, mobile: false, restRot: -6, label: "Layer 09", opacity: 82 },
    { slot: 10, depth: 0.85, mobile: false, restRot: 4, label: "Layer 10", opacity: 94 },
  ];

  return layouts.map((l, i) => ({
    ...l,
    src: unique[i % unique.length],
  }));
}

type ArtboardFieldProps = {
  ready?: boolean;
  className?: string;
  onPointerNorm?: (x: number, y: number) => void;
};

export function ArtboardField({
  ready = false,
  className,
  onPointerNorm,
}: ArtboardFieldProps) {
  const reduced = useReducedMotion();
  const workItems = useWorkItems();
  const slots = useMemo(() => buildSlots(workItems), [workItems]);
  const rootRef = useRef<HTMLDivElement>(null);
  const [hot, setHot] = useState<number | null>(null);
  const hotRef = useRef<number | null>(null);
  const onPointerNormRef = useRef(onPointerNorm);

  useEffect(() => {
    hotRef.current = hot;
  }, [hot]);

  useEffect(() => {
    onPointerNormRef.current = onPointerNorm;
  }, [onPointerNorm]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced || !ready) return;

    const layers = Array.from(
      root.querySelectorAll<HTMLElement>("[data-layer]"),
    );
    if (layers.length === 0) return;

    const n = layers.length;
    const ox = new Float64Array(n);
    const oy = new Float64Array(n);
    const vx = new Float64Array(n);
    const vy = new Float64Array(n);
    const rot = new Float64Array(n);
    const vRot = new Float64Array(n);
    const scale = new Float64Array(n).fill(1);
    const vScale = new Float64Array(n);
    const depths = layers.map((el) => Number(el.dataset.depth) || 0.7);
    const restRots = layers.map((el) => Number(el.dataset.rot) || 0);

    for (let i = 0; i < n; i++) rot[i] = restRots[i];

    let raf = 0;
    let onScreen = true;
    let physicsLive = false;
    let pointerX = 0;
    let pointerY = 0;
    let hasPointer = false;
    let smX = 0;
    let smY = 0;
    let allowRepulse = !window.matchMedia("(max-width: 960px)").matches;
    const t0 = performance.now();

    const SPRING = 0.12;
    const DAMP = 0.82;
    const REPULSE_R = 240;
    const REPULSE_FORCE = 105;

    const measureCenters = () => {
      const field = root.getBoundingClientRect();
      layers.forEach((el) => {
        const prev = el.style.transform;
        el.style.transform = "";
        const rr = el.getBoundingClientRect();
        (el as HTMLElement & { __rx?: number; __ry?: number }).__rx =
          rr.left + rr.width / 2 - field.left;
        (el as HTMLElement & { __rx?: number; __ry?: number }).__ry =
          rr.top + rr.height / 2 - field.top;
        el.style.transform = prev;
      });
    };

    const wakeId = window.setTimeout(() => {
      layers.forEach((el) => {
        el.style.animation = "none";
        el.style.opacity = "";
        el.style.filter = "none";
      });
      measureCenters();
      physicsLive = true;
    }, 1180);

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const field = root.getBoundingClientRect();
      pointerX = e.clientX - field.left;
      pointerY = e.clientY - field.top;
      hasPointer = true;

      const nx = (pointerX / Math.max(field.width, 1) - 0.5) * 2;
      const ny = (pointerY / Math.max(field.height, 1) - 0.5) * 2;
      onPointerNormRef.current?.(nx, ny);
    };

    const onLeave = () => {
      hasPointer = false;
      hotRef.current = null;
      setHot(null);
      onPointerNormRef.current?.(0, 0);
    };

    const onLayerEnter = (i: number) => () => {
      hotRef.current = i;
      setHot(i);
    };

    const onLayerLeave = () => {
      hotRef.current = null;
      setHot(null);
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!onScreen || !physicsLive) return;

      const t = (now - t0) * 0.001;
      const field = root.getBoundingClientRect();
      const ambient = hasPointer ? 0.22 : 1;

      if (hasPointer) {
        const nx = (pointerX / Math.max(field.width, 1) - 0.5) * 2;
        const ny = (pointerY / Math.max(field.height, 1) - 0.5) * 2;
        smX += (nx - smX) * 0.07;
        smY += (ny - smY) * 0.07;
      } else {
        smX += (0 - smX) * 0.05;
        smY += (0 - smY) * 0.05;
      }

      for (let i = 0; i < n; i++) {
        const el = layers[i];
        const depth = depths[i];
        const rx = (el as HTMLElement & { __rx?: number }).__rx ?? 0;
        const ry = (el as HTMLElement & { __ry?: number }).__ry ?? 0;

        let targetX =
          -smX * (16 + depth * 30) +
          Math.sin(t * 0.3 + i * 1.25) * 6.5 * ambient * depth;
        let targetY =
          -smY * (11 + depth * 20) +
          Math.cos(t * 0.24 + i * 0.85) * 5 * ambient * depth;

        if (hasPointer && allowRepulse) {
          const px = rx + ox[i];
          const py = ry + oy[i];
          const dx = px - pointerX;
          const dy = py - pointerY;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < REPULSE_R) {
            const falloff = 1 - dist / REPULSE_R;
            const force =
              falloff * falloff * REPULSE_FORCE * (0.55 + depth * 0.55);
            targetX += (dx / dist) * force;
            targetY += (dy / dist) * force;
          } else {
            const pull = 6.5 * depth * Math.min(1, dist / (field.width || 1));
            targetX += ((pointerX - rx) / (field.width || 1)) * pull * 5;
            targetY += ((pointerY - ry) / (field.height || 1)) * pull * 3.5;
          }
        }

        const isHot = hotRef.current === i;
        const targetScale = isHot ? 1.12 : hotRef.current !== null ? 0.94 : 1;
        const targetRot =
          restRots[i] +
          smX * (2.2 + depth * 4) * (isHot ? 1.7 : 0.6) +
          (hasPointer && isHot
            ? ((pointerX - (rx + ox[i])) / 38) * 0.38
            : Math.sin(t * 0.18 + i) * 0.55 * ambient);

        vx[i] += (targetX - ox[i]) * SPRING;
        vy[i] += (targetY - oy[i]) * SPRING;
        vx[i] *= DAMP;
        vy[i] *= DAMP;
        ox[i] += vx[i];
        oy[i] += vy[i];

        vRot[i] += (targetRot - rot[i]) * SPRING;
        vRot[i] *= DAMP;
        rot[i] += vRot[i];

        vScale[i] += (targetScale - scale[i]) * 0.14;
        vScale[i] *= 0.82;
        scale[i] += vScale[i];

        el.style.transform =
          `translate3d(${ox[i].toFixed(2)}px, ${oy[i].toFixed(2)}px, 0) ` +
          `rotate(${rot[i].toFixed(2)}deg) scale(${scale[i].toFixed(3)})`;
        el.style.zIndex = isHot ? "8" : String(Math.round(depth * 4));
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
      },
      { threshold: 0.04 },
    );
    observer.observe(root);

    const onResize = () => {
      allowRepulse = !window.matchMedia("(max-width: 960px)").matches;
      layers.forEach((el) => {
        el.style.transform = "";
      });
      measureCenters();
      ox.fill(0);
      oy.fill(0);
    };

    const hero = root.closest(".hero") ?? root;
    hero.addEventListener("pointermove", onMove as EventListener, {
      passive: true,
    });
    hero.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", onResize);

    const layerCleanups = layers.map((el, i) => {
      const enter = onLayerEnter(i);
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointerleave", onLayerLeave);
      return () => {
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointerleave", onLayerLeave);
      };
    });

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(wakeId);
      observer.disconnect();
      hero.removeEventListener("pointermove", onMove as EventListener);
      hero.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
      layerCleanups.forEach((fn) => fn());
      layers.forEach((el) => {
        el.style.transform = "";
        el.style.zIndex = "";
        el.style.animation = "";
        el.style.opacity = "";
        el.style.filter = "";
      });
    };
  }, [reduced, ready, slots.length]);

  return (
    <div
      ref={rootRef}
      className={cn(
        "artboard",
        ready && "is-ready",
        reduced && "is-static",
        className,
      )}
      aria-hidden
    >
      <div className="artboard__checker" />
      <div className="artboard__ruler artboard__ruler--x" />
      <div className="artboard__ruler artboard__ruler--y" />
      <div className="artboard__glow" />

      {slots.map((s, i) => (
        <Link
          key={`${s.slot}-${s.src}`}
          href={ROUTES.work}
          className={cn(
            "artboard__layer",
            `artboard__layer--${s.slot}`,
            s.mobile && "is-mobile",
            hot === i && "is-hot",
            hot !== null && hot !== i && "is-dim",
          )}
          data-layer
          data-depth={s.depth}
          data-rot={s.restRot}
          style={{
            ["--i" as string]: i,
            ["--rest-rot" as string]: `${s.restRot}deg`,
          }}
          tabIndex={-1}
        >
          <span className="artboard__chip">
            <span className="artboard__chip-name">{s.label}</span>
            <span className="artboard__chip-op">{s.opacity}%</span>
          </span>
          <span className="artboard__media">
            <Image
              src={s.src}
              alt=""
              fill
              sizes="(max-width: 900px) 42vw, 22vw"
              priority={i < 4}
              className="artboard__img"
            />
          </span>
        </Link>
      ))}
    </div>
  );
}
