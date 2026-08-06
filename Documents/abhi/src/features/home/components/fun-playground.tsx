"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Container } from "@/components/layout/container";
import { RoleCycle } from "@/components/motion/role-cycle";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { SITE_IMAGE } from "@/lib/constants";
import {
  FUN_CENTER_LINES,
  FUN_DESIGNS,
  funScrapSrc,
  type FunDesign,
} from "@/lib/fun-designs";

/* ================================================================== *
 * Desk scraps
 *
 * Every scrap orbits the desk until you touch it. Drag one anywhere in
 * the stage and it stays pinned exactly there — the orbit lets it go.
 * A plain click still opens the Behance project in a new tab; only a
 * real drag suppresses that.
 * ================================================================== */

/** Position as a percentage of the stage, measured from its centre. */
type Pos = { x: number; y: number };

type DragState = {
  id: string;
  pointerId: number;
  originX: number;
  originY: number;
  startX: number;
  startY: number;
  limitX: number;
  limitY: number;
  moved: boolean;
};

const SAT_Z_BASE = 2;
const SAT_Z_DRAG = 30;
const CENTER_Z = 40;

/** Ignore tiny pointer jitter so a click still opens the project. */
const CLICK_SLOP_PX = 10;
/** Base orbit period in ms for speed = 1. */
const ORBIT_MS = 42000;
/** Breathing room between a scrap and the edge of the desk. */
const EDGE_PAD_PX = 12;
/** Arrow-key nudge, in percent of the stage. */
const KEY_STEP = 2.5;
/** How long scraps glide when they are sent back into orbit. */
const RETURN_MS = 780;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Orbit position for a given turn (0–1) of a scrap's ellipse. */
function orbitAt(design: FunDesign, turn: number): Pos {
  const angle = turn * Math.PI * 2;
  return {
    x: Math.cos(angle) * design.radius,
    y: Math.sin(angle) * design.radius * 0.72,
  };
}

/** Resting pose each scrap is rendered at before the loop takes over. */
const BASE_POSITIONS: Readonly<Record<string, Pos>> = Object.fromEntries(
  FUN_DESIGNS.map((d) => [d.id, orbitAt(d, d.phase)]),
);

function FunCard({
  design,
  base,
  z,
  dragging,
  pinned,
  easing,
  cardRef,
  onPointerDown,
  onKeyDown,
  onClick,
}: {
  design: FunDesign;
  base: Pos;
  z: number;
  dragging: boolean;
  pinned: boolean;
  easing: boolean;
  cardRef: (el: HTMLAnchorElement | null) => void;
  onPointerDown: (e: React.PointerEvent<HTMLAnchorElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLAnchorElement>) => void;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const [failed, setFailed] = useState(false);
  const src = failed ? SITE_IMAGE : funScrapSrc(design);

  return (
    <a
      ref={cardRef}
      href={design.href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "fun__card",
        dragging && "is-dragging",
        pinned && "is-pinned",
        easing && "is-easing",
      )}
      style={{
        // Container units hold the orbit pose until the loop takes over,
        // so nothing is stacked in the middle on first paint.
        ["--tx" as string]: `${base.x.toFixed(3)}cqw`,
        ["--ty" as string]: `${base.y.toFixed(3)}cqh`,
        ["--rot" as string]: `${design.rot}deg`,
        zIndex: z,
      }}
      aria-label={`${design.title} — open on Behance in a new tab`}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      onClick={onClick}
      draggable={false}
    >
      <span className="fun__card-face">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="fun__card-img"
          draggable={false}
          loading="lazy"
          onError={() => setFailed(true)}
        />
        <span className="fun__card-open" aria-hidden>
          ↗
        </span>
        <span className="fun__card-meta">
          <span className="fun__card-title">{design.title}</span>
          <span className="fun__card-note">{design.note}</span>
        </span>
      </span>
      <span className="fun__card-pin" aria-hidden />
    </a>
  );
}

export function FunPlayground() {
  const reduced = useReducedMotion();

  const stageRef = useRef<HTMLDivElement>(null);
  const cards = useRef(new Map<string, HTMLAnchorElement>());
  const stageSize = useRef({ w: 0, h: 0 });

  const pos = useRef<Record<string, Pos>>({ ...BASE_POSITIONS });
  const orbitOrigin = useRef<Record<string, number>>({});
  const dragRef = useRef<DragState | null>(null);
  const pinnedRef = useRef(new Set<string>());
  /** True when the last pointer gesture was a drag (block link navigation). */
  const suppressClick = useRef(false);

  const [dragId, setDragId] = useState<string | null>(null);
  const [pinned, setPinned] = useState<readonly string[]>([]);
  const [easing, setEasing] = useState(false);
  const [order, setOrder] = useState(() => FUN_DESIGNS.map((d) => d.id));
  /** Phone / coarse pointer: static grid, no orbit or drag. */
  const [mobileDesk, setMobileDesk] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 700px)");
    const sync = () => setMobileDesk(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /* --- Writing a scrap's pose ------------------------------------- */

  const write = useCallback((id: string) => {
    const el = cards.current.get(id);
    const { w, h } = stageSize.current;
    if (!el || !w) return;
    const p = pos.current[id];
    el.style.setProperty("--tx", `${((p.x / 100) * w).toFixed(2)}px`);
    el.style.setProperty("--ty", `${((p.y / 100) * h).toFixed(2)}px`);
  }, []);

  const writeAll = useCallback(() => {
    for (const d of FUN_DESIGNS) write(d.id);
  }, [write]);

  /** Keep a scrap fully inside the desk, whatever its size. */
  const limitsFor = useCallback((id: string) => {
    const el = cards.current.get(id);
    const { w, h } = stageSize.current;
    if (!el || !w) return { limitX: 40, limitY: 38 };
    return {
      limitX: Math.max(0, 50 - ((el.offsetWidth / 2 + EDGE_PAD_PX) / w) * 100),
      limitY: Math.max(0, 50 - ((el.offsetHeight / 2 + EDGE_PAD_PX) / h) * 100),
    };
  }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const sync = () => {
      stageSize.current = { w: stage.clientWidth, h: stage.clientHeight };
      // Percentages are the source of truth, so a resize re-projects them —
      // and pinned scraps get re-clamped in case the desk got smaller.
      for (const id of pinnedRef.current) {
        const { limitX, limitY } = limitsFor(id);
        const p = pos.current[id];
        pos.current[id] = {
          x: clamp(p.x, -limitX, limitX),
          y: clamp(p.y, -limitY, limitY),
        };
      }
      writeAll();
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [limitsFor, writeAll]);

  /* --- Orbit: runs until a scrap is pinned ------------------------ */

  useEffect(() => {
    const t0 = performance.now();
    for (const d of FUN_DESIGNS) {
      orbitOrigin.current[d.id] = t0 - d.phase * (ORBIT_MS / d.speed);
    }
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || reduced || mobileDesk) return;

    let raf = 0;
    let visible = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.02 },
    );
    observer.observe(stage);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible || document.hidden) return;

      for (const d of FUN_DESIGNS) {
        if (pinnedRef.current.has(d.id)) continue;
        if (dragRef.current?.id === d.id) continue;
        const period = ORBIT_MS / d.speed;
        const origin = orbitOrigin.current[d.id] ?? now;
        pos.current[d.id] = orbitAt(d, ((now - origin) % period) / period);
        write(d.id);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [reduced, mobileDesk, write]);

  /** Re-enter the orbit at the angle the scrap currently sits at. */
  const reseedOrbit = useCallback((id: string) => {
    const design = FUN_DESIGNS.find((d) => d.id === id);
    if (!design) return;
    const p = pos.current[id] ?? { x: 0, y: 0 };
    const angle = Math.atan2(p.y / 0.72, p.x);
    const turn = (angle / (Math.PI * 2) + 1) % 1;
    orbitOrigin.current[id] =
      performance.now() - turn * (ORBIT_MS / design.speed);
  }, []);

  const pin = useCallback((id: string) => {
    if (pinnedRef.current.has(id)) return;
    pinnedRef.current.add(id);
    setPinned(Array.from(pinnedRef.current));
  }, []);

  const lift = useCallback((id: string) => {
    setOrder((prev) => [...prev.filter((x) => x !== id), id]);
  }, []);

  const zFor = useCallback(
    (id: string, isDragging: boolean) =>
      isDragging ? SAT_Z_DRAG : SAT_Z_BASE + Math.max(0, order.indexOf(id)),
    [order],
  );

  /* --- Drag -------------------------------------------------------- */

  const onPointerDown = useCallback(
    (id: string) => (e: React.PointerEvent<HTMLAnchorElement>) => {
      if (e.button !== 0) return;
      // Mobile grid is tap-to-open only — never capture the pointer.
      if (window.matchMedia("(max-width: 700px)").matches) return;

      const start = pos.current[id] ?? { x: 0, y: 0 };
      const { limitX, limitY } = limitsFor(id);
      dragRef.current = {
        id,
        pointerId: e.pointerId,
        originX: e.clientX,
        originY: e.clientY,
        startX: start.x,
        startY: start.y,
        limitX,
        limitY,
        moved: false,
      };
      suppressClick.current = false;
      setDragId(id);
      lift(id);

      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag || ev.pointerId !== drag.pointerId) return;

        const dx = ev.clientX - drag.originX;
        const dy = ev.clientY - drag.originY;
        if (!drag.moved && Math.hypot(dx, dy) > CLICK_SLOP_PX) {
          drag.moved = true;
          suppressClick.current = true;
        }
        if (!drag.moved) return;

        const { w, h } = stageSize.current;
        if (!w || !h) return;
        pos.current[drag.id] = {
          x: clamp(drag.startX + (dx / w) * 100, -drag.limitX, drag.limitX),
          y: clamp(drag.startY + (dy / h) * 100, -drag.limitY, drag.limitY),
        };
        write(drag.id);
      };

      const onUp = (ev: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag || ev.pointerId !== drag.pointerId) return;

        // Moved scraps stay exactly where they were dropped; an untouched
        // one simply rejoins its orbit from the angle it is sitting at.
        if (drag.moved) pin(drag.id);
        else reseedOrbit(drag.id);

        dragRef.current = null;
        setDragId(null);

        target.removeEventListener("pointermove", onMove);
        target.removeEventListener("pointerup", onUp);
        target.removeEventListener("pointercancel", onUp);
        if (target.hasPointerCapture(ev.pointerId)) {
          target.releasePointerCapture(ev.pointerId);
        }
      };

      target.addEventListener("pointermove", onMove);
      target.addEventListener("pointerup", onUp);
      target.addEventListener("pointercancel", onUp);
    },
    [lift, limitsFor, pin, reseedOrbit, write],
  );

  /* --- Keyboard: nudge a scrap without a pointer ------------------- */

  const onKeyDown = useCallback(
    (id: string) => (e: React.KeyboardEvent<HTMLAnchorElement>) => {
      const step =
        e.key === "ArrowLeft"
          ? { x: -KEY_STEP, y: 0 }
          : e.key === "ArrowRight"
            ? { x: KEY_STEP, y: 0 }
            : e.key === "ArrowUp"
              ? { x: 0, y: -KEY_STEP }
              : e.key === "ArrowDown"
                ? { x: 0, y: KEY_STEP }
                : null;
      if (!step) return;

      e.preventDefault();
      const { limitX, limitY } = limitsFor(id);
      const p = pos.current[id] ?? { x: 0, y: 0 };
      pos.current[id] = {
        x: clamp(p.x + step.x, -limitX, limitX),
        y: clamp(p.y + step.y, -limitY, limitY),
      };
      pin(id);
      lift(id);
      write(id);
    },
    [lift, limitsFor, pin, write],
  );

  const onClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    // After a drag, don't open the project. Plain clicks use the real href.
    if (suppressClick.current) {
      e.preventDefault();
      suppressClick.current = false;
    }
  }, []);

  /* --- Send everything back into orbit ----------------------------- */

  const resetDesk = useCallback(() => {
    for (const id of pinnedRef.current) reseedOrbit(id);
    pinnedRef.current.clear();
    setPinned([]);
    setOrder(FUN_DESIGNS.map((d) => d.id));
    // Glide back instead of snapping: the loop keeps writing, the
    // transition catches up over one beat.
    setEasing(true);
    window.setTimeout(() => setEasing(false), RETURN_MS);
  }, [reseedOrbit]);

  useEffect(() => {
    if (!reduced) return;
    // No orbit under reduced motion — place each scrap once and leave it.
    writeAll();
  }, [reduced, writeAll]);

  return (
    <section className="fun" aria-labelledby="fun-heading">
      <Container>
        <header className="fun__head">
          <p className="fun__eyebrow">04 — For fun</p>
          <h2 id="fun-heading" className="fun__title">
            Desk scraps
          </h2>
          <p className="fun__lede">
            {mobileDesk
              ? "Five Behance creatives from the desk. Tap a scrap to open the project."
              : "Five Behance creatives circling the desk. Click one to open the project in a new tab, or drag it anywhere on the desk — where you drop it is where it stays."}
          </p>
          {!mobileDesk ? (
            <button
              type="button"
              className={cn("fun__reset", pinned.length > 0 && "is-shown")}
              onClick={resetDesk}
              tabIndex={pinned.length > 0 ? 0 : -1}
              aria-hidden={pinned.length === 0}
            >
              <span className="fun__reset-dot" aria-hidden />
              Send them back into orbit
            </button>
          ) : null}
        </header>
      </Container>

      <div
        ref={stageRef}
        className={cn("fun__stage", mobileDesk && "fun__stage--grid")}
      >
        {!mobileDesk ? (
          <div className="fun__center" style={{ zIndex: CENTER_Z }}>
            <p className="fun__center-eyebrow">On the desk</p>
            <span className="sr-only">{FUN_CENTER_LINES.join(", ")}</span>
            <RoleCycle
              roles={FUN_CENTER_LINES}
              className="fun__center-cycle"
              holdMs={2400}
            />
          </div>
        ) : (
          <p className="fun__grid-label">On the desk</p>
        )}

        {FUN_DESIGNS.map((design) => (
          <FunCard
            key={design.id}
            design={design}
            base={BASE_POSITIONS[design.id]}
            z={zFor(design.id, dragId === design.id)}
            dragging={dragId === design.id}
            pinned={pinned.includes(design.id)}
            easing={easing}
            cardRef={(el) => {
              if (el) cards.current.set(design.id, el);
              else cards.current.delete(design.id);
            }}
            onPointerDown={onPointerDown(design.id)}
            onKeyDown={onKeyDown(design.id)}
            onClick={onClick}
          />
        ))}
      </div>
    </section>
  );
}
