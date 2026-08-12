"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { TOOLS, type Tool } from "@/lib/about";
import { useAbout } from "@/lib/cms/hooks";

/* ================================================================== *
 * Toolbox — four brand cubes with real weight.
 *
 * They drop in, bounce, knock into each other and settle. You can drag
 * and throw them; clicking one makes it jump, tumble and select itself.
 * A single rAF loop integrates every body and writes transforms; React
 * only owns "which tool is selected".
 * ================================================================== */

const GRAVITY = 2600; // px/s²
const RESTITUTION = 0.5; // bounce energy kept
const FLOOR_FRICTION = 0.86;
const AIR = 0.995;
const REST_EPS = 26; // px/s below which a grounded cube sleeps

type Body = {
  x: number; // left, px within tray
  y: number; // top, px within tray
  vx: number;
  vy: number;
  rot: number; // z rotation, deg
  vrot: number;
  spin: number; // y-axis tumble, deg
  vspin: number;
  squash: number; // 0…1 impact deform
  asleep: boolean;
};

function ToolFaces({ tool }: { tool: Tool }) {
  return (
    <>
      <span className="cube__face cube__face--front">
        <span className="cube__glyph">{tool.short}</span>
        <span className="cube__corner" aria-hidden />
      </span>
      <span className="cube__face cube__face--back">
        <span className="cube__serial">{tool.serial}</span>
      </span>
      <span className="cube__face cube__face--right">
        <span className="cube__grid" aria-hidden />
      </span>
      <span className="cube__face cube__face--left">
        <span className="cube__glyph cube__glyph--sm">{tool.short}</span>
      </span>
      <span className="cube__face cube__face--top" />
      <span className="cube__face cube__face--bottom" />
    </>
  );
}

export function AboutToolkit() {
  const about = useAbout<{ tools?: Tool[] }>();
  const tools = about.tools?.length ? about.tools : TOOLS;
  const [active, setActive] = useState<string | null>(null);
  /**
   * The cubes are always playable — `prefers-reduced-motion` governs *automatic*
   * motion, not direct manipulation the visitor initiates. When it is set we
   * simply skip the entrance drop and the idle hops, and the cubes begin at
   * rest; dragging, throwing and tapping still work.
   */
  const reduced = useReducedMotion();

  const trayRef = useRef<HTMLDivElement>(null);
  const cubeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const bodies = useRef<Body[]>([]);
  const size = useRef(96);
  const tray = useRef({ w: 0, h: 0 });
  const held = useRef<number | null>(null);
  const pointer = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const grab = useRef({ x: 0, y: 0 });
  const downAt = useRef({ x: 0, y: 0, moved: false });

  const current = tools.find((t) => t.id === active) ?? null;

  /**
   * Place the cubes. Normally they start above the tray so they can fall in;
   * with reduced motion they begin already resting on the shelf.
   */
  const layout = useCallback(() => {
    const el = trayRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    tray.current = { w: r.width, h: r.height };
    size.current = r.width < 560 ? 68 : 96;

    const s = size.current;
    const slot = tray.current.w / tools.length;
    bodies.current = tools.map((_, i) => ({
      x: slot * i + slot / 2 - s / 2 + (reduced ? 0 : (Math.random() - 0.5) * 18),
      y: reduced ? r.height - s : -s - i * 140 - 80,
      vx: 0,
      vy: 0,
      rot: reduced ? 0 : (Math.random() - 0.5) * 26,
      vrot: reduced ? 0 : (Math.random() - 0.5) * 90,
      spin: 0,
      vspin: reduced ? 0 : (Math.random() - 0.5) * 60,
      squash: 0,
      asleep: reduced,
    }));
  }, [reduced]);

  useEffect(() => {
    const el = trayRef.current;
    if (!el) return;

    // Physics is live from here on, so hand layout over to transforms.
    el.classList.add("is-live");
    layout();
    // Re-place on resize, then repaint immediately so nothing snaps.
    const ro = new ResizeObserver(() => {
      layout();
      draw();
    });
    ro.observe(el);

    let raf = 0;
    let last = 0;
    let visible = true;
    let nextHop = 4000;

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
      },
      { threshold: 0 },
    );
    io.observe(el);

    const step = (dt: number, now: number) => {
      const s = size.current;
      const { w, h } = tray.current;
      const list = bodies.current;

      for (let i = 0; i < list.length; i += 1) {
        const b = list[i];

        if (held.current === i) {
          // Follow the pointer; implied velocity carries the throw.
          const nx = pointer.current.x - grab.current.x;
          const ny = pointer.current.y - grab.current.y;
          b.vx = (nx - b.x) / Math.max(dt, 0.001);
          b.vy = (ny - b.y) / Math.max(dt, 0.001);
          b.x = nx;
          b.y = ny;
          b.asleep = false;
          continue;
        }

        if (b.asleep) continue;

        b.vy += GRAVITY * dt;
        b.vx *= AIR;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.rot += b.vrot * dt;
        b.spin += b.vspin * dt;
        b.vrot *= 0.99;
        b.vspin *= 0.99;
        b.squash *= 0.86;

        // Walls
        if (b.x < 0) {
          b.x = 0;
          b.vx = Math.abs(b.vx) * RESTITUTION;
          b.vrot += 40;
        } else if (b.x + s > w) {
          b.x = w - s;
          b.vx = -Math.abs(b.vx) * RESTITUTION;
          b.vrot -= 40;
        }

        // Floor
        if (b.y + s >= h) {
          b.y = h - s;
          if (Math.abs(b.vy) > REST_EPS) {
            b.squash = Math.min(0.34, Math.abs(b.vy) / 2600);
            b.vy = -b.vy * RESTITUTION;
            b.vx *= FLOOR_FRICTION;
            b.vrot = b.vrot * 0.55 + b.vx * 0.12;
          } else {
            b.vy = 0;
            b.vx *= 0.82;
            b.vrot *= 0.8;
            // Settle square onto a face.
            const near = Math.round(b.rot / 90) * 90;
            b.rot += (near - b.rot) * 0.16;
            const nearSpin = Math.round(b.spin / 90) * 90;
            b.spin += (nearSpin - b.spin) * 0.16;
            if (
              Math.abs(b.vx) < 4 &&
              Math.abs(b.rot - near) < 0.4 &&
              Math.abs(b.spin - nearSpin) < 0.4
            ) {
              b.rot = near;
              b.spin = nearSpin;
              b.vx = 0;
              b.vrot = 0;
              b.vspin = 0;
              b.asleep = true;
            }
          }
        }
      }

      // Cube-cube separation (circle approximation, equal mass).
      const r = s / 2;
      for (let i = 0; i < list.length; i += 1) {
        for (let j = i + 1; j < list.length; j += 1) {
          const a = list[i];
          const c = list[j];
          const dx = c.x - a.x;
          const dy = c.y - a.y;
          const d = Math.hypot(dx, dy) || 1e-6;
          const min = r * 1.85;
          if (d >= min) continue;
          const nx = dx / d;
          const ny = dy / d;
          const push = (min - d) / 2;
          if (held.current !== i) {
            a.x -= nx * push;
            a.y -= ny * push;
            a.asleep = false;
          }
          if (held.current !== j) {
            c.x += nx * push;
            c.y += ny * push;
            c.asleep = false;
          }
          const rel = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
          if (rel < 0) {
            const imp = -rel * 0.5;
            if (held.current !== i) {
              a.vx -= imp * nx;
              a.vy -= imp * ny;
            }
            if (held.current !== j) {
              c.vx += imp * nx;
              c.vy += imp * ny;
            }
            a.vrot -= imp * 0.5;
            c.vrot += imp * 0.5;
          }
        }
      }

      // Occasional idle hop so the tray never looks dead. This one *is*
      // automatic motion, so it stays off under reduced motion.
      if (!reduced && now > nextHop) {
        nextHop = now + 4200 + Math.random() * 4200;
        const sleepers = list.filter((b) => b.asleep);
        if (sleepers.length) {
          const b = sleepers[Math.floor(Math.random() * sleepers.length)];
          b.asleep = false;
          b.vy = -300 - Math.random() * 120;
          b.vrot = (Math.random() - 0.5) * 120;
        }
      }
    };

    const draw = () => {
      const s = size.current;
      for (let i = 0; i < bodies.current.length; i += 1) {
        const b = bodies.current[i];
        const node = cubeRefs.current[i];
        if (!node) continue;
        const sx = 1 + b.squash;
        const sy = 1 - b.squash;
        node.style.width = `${s}px`;
        node.style.height = `${s}px`;
        node.style.transform = `translate3d(${b.x.toFixed(2)}px, ${b.y.toFixed(
          2,
        )}px, 0) rotate(${b.rot.toFixed(2)}deg) scale(${sx.toFixed(
          3,
        )}, ${sy.toFixed(3)})`;
        node.style.setProperty("--spin", `${b.spin.toFixed(2)}deg`);
        node.style.setProperty("--s", `${s}px`);
      }
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!last) last = now;
      const dt = Math.min((now - last) / 1000, 0.032);
      last = now;
      if (!visible) return;
      step(dt, now);
      draw();
    };
    // Paint frame zero synchronously: until the first rAF fires the cubes
    // would otherwise sit stacked at the tray origin.
    draw();
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [layout, reduced]);

  /* --- Pointer: drag / throw / jump ------------------------------- */

  const toLocal = (cx: number, cy: number) => {
    const r = trayRef.current?.getBoundingClientRect();
    return r ? { x: cx - r.left, y: cy - r.top } : { x: 0, y: 0 };
  };

  const onDown = (i: number) => (e: React.PointerEvent<HTMLButtonElement>) => {
    const l = toLocal(e.clientX, e.clientY);
    const b = bodies.current[i];
    if (!b) return;
    // Capture is an enhancement (keeps the drag alive outside the button) —
    // never let it throwing stop the grab itself.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
    grab.current = { x: l.x - b.x, y: l.y - b.y };
    pointer.current = { x: l.x, y: l.y, px: l.x, py: l.y };
    held.current = i;
    b.asleep = false;
    downAt.current = { x: e.clientX, y: e.clientY, moved: false };
    window.__lenis?.stop();
  };

  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (held.current === null) return;
    const l = toLocal(e.clientX, e.clientY);
    pointer.current = { ...pointer.current, x: l.x, y: l.y };
    if (
      Math.hypot(e.clientX - downAt.current.x, e.clientY - downAt.current.y) > 6
    ) {
      downAt.current.moved = true;
    }
  };

  const onUp = (i: number, id: string) =>
    (e: React.PointerEvent<HTMLButtonElement>) => {
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        /* already released */
      }
      const wasTap = held.current === i && !downAt.current.moved;
      held.current = null;
      window.__lenis?.start();

      const b = bodies.current[i];
      if (b) {
        // Cap throw speed so a fast flick can't fling it off-tray.
        b.vx = Math.max(-2200, Math.min(2200, b.vx));
        b.vy = Math.max(-2200, Math.min(2200, b.vy));
        if (wasTap) {
          b.vy = -880;
          b.vrot = (Math.random() - 0.5) * 240;
          b.vspin = 260 + Math.random() * 220;
        }
        b.asleep = false;
      }
      if (wasTap) setActive((cur) => (cur === id ? null : id));
    };

  /** Keyboard parity: select and pop the cube. */
  const onKey = (i: number, id: string) =>
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      const b = bodies.current[i];
      if (b) {
        b.asleep = false;
        b.vy = -880;
        b.vspin = 260;
      }
      setActive((cur) => (cur === id ? null : id));
    };

  return (
    <section className="tk" aria-labelledby="tk-title">
      <div className="tk__head">
        <p className="tk__eyebrow">
          <span className="tk__tick" aria-hidden />
          Instruments / 04
        </p>
        <h2 id="tk-title" className="tk__title">
          My toolkit
        </h2>
        <p className="tk__hint">
          Drag them, throw them, knock them together — tap one to open it.
        </p>
      </div>

      <div
        ref={trayRef}
        className="tk__tray"
        data-active={active ?? undefined}
      >
        <span className="tk__tray-rule" aria-hidden />

        {tools.map((tool, i) => (
          <button
            key={tool.id}
            ref={(el) => {
              cubeRefs.current[i] = el;
            }}
            type="button"
            className={cn("cube", active === tool.id && "is-on")}
            style={
              {
                "--bg": tool.bg,
                "--fg": tool.fg,
              } as React.CSSProperties
            }
            aria-pressed={active === tool.id}
            aria-label={`${tool.name}. ${tool.skills.join(", ")}`}
            onPointerDown={onDown(i)}
            onPointerMove={onMove}
            onPointerUp={onUp(i, tool.id)}
            onPointerCancel={onUp(i, tool.id)}
            onKeyDown={onKey(i, tool.id)}
          >
            <span className="cube__box" aria-hidden>
              <ToolFaces tool={tool} />
            </span>
          </button>
        ))}
      </div>

      {/* Always in the DOM — capabilities are never hover-only. */}
      <div className="tk__readout">
        <p className="tk__readout-name">{current ? current.name : "Toolkit"}</p>
        <ul className="tk__readout-list">
          {(current ? current.skills : tools.flatMap((t) => t.skills)).map(
            (skill, i) => (
              <li key={skill} style={{ ["--i" as string]: i }}>
                {skill}
              </li>
            ),
          )}
        </ul>
      </div>
    </section>
  );
}
