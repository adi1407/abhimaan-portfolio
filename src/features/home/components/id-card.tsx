"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/* ================================================================== *
 * Lanyard ID card
 *
 * A verlet rope hangs from a point above the viewport. The card is held
 * off-screen until the hero type has revealed, then released — from that
 * moment everything (drop, tension, overshoot, swing, settle, throw) is
 * pure gravity + distance constraints, never scripted keyframes.
 * ================================================================== */

type Point = { x: number; y: number; px: number; py: number; locked: boolean };

const SEGMENTS = 16;
const GRAVITY = 2600; // px/s²
const DAMPING = 0.988;
const ITERATIONS = 20;
const STEP = 1 / 120; // fixed physics timestep (s)
const STRAP_WIDTH = 18;

const DROP_DELAY = 560; // ms of stillness after mount (type reveals first)
const SETTLE_AFTER = 3200; // ms after release before idle sway begins
const FADE_MS = 260; // card fades in over the first slice of the fall

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function solve(a: Point, b: Point, length: number) {
  const wa = a.locked ? 0 : 1;
  const wb = b.locked ? 0 : 1;
  const total = wa + wb;
  if (total === 0) return;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1e-6;
  const diff = (dist - length) / dist;
  a.x += dx * diff * (wa / total);
  a.y += dy * diff * (wa / total);
  b.x -= dx * diff * (wb / total);
  b.y -= dy * diff * (wb / total);
}

type Size = { w: number; h: number };

type IdCardProps = {
  name?: string;
  role?: string;
  photoSrc?: string;
  location?: string;
  email?: string;
  /**
   * Horizontal anchor as a fraction of the stage width. Defaults to the hero's
   * off-centre hang; About centres it.
   */
  anchorRatio?: number;
  /**
   * Live anchor in stage pixels, sampled every physics step. Supplied by a
   * carrier (the hero plane) so the rope hangs from something that moves —
   * the swing then falls out of the simulation rather than being scripted.
   */
  anchor?: (stage: Size, card: Size) => { x: number; y: number };
  /** Rope length in px. Defaults to the off-screen hang above the viewport. */
  ropeLength?: (stage: Size, card: Size) => number;
  /** The carrier owns the exit, so skip the built-in scroll lift. */
  carried?: boolean;
};

const SOCIALS = ["Instagram", "Behance", "LinkedIn"];

export function IdCard({
  name = "Abhimaan",
  role = "Art Designer",
  photoSrc = "/profile.png",
  location = "IN",
  email = "hello@abhimaan.studio",
  anchorRatio,
  anchor: anchorAt,
  ropeLength,
  carried = false,
}: IdCardProps) {
  const reduced = useReducedMotion();

  // Read by the RAF loop without re-subscribing it every render.
  const carry = useRef({ anchorAt, ropeLength });
  useEffect(() => {
    carry.current = { anchorAt, ropeLength };
  });

  const stageRef = useRef<HTMLDivElement>(null);
  const strapFill = useRef<SVGPathElement>(null);
  const strapWeave = useRef<SVGPathElement>(null);
  const strapSeam = useRef<SVGPathElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const pivotRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<HTMLDivElement>(null);

  const points = useRef<Point[]>([]);
  const size = useRef({ w: 0, h: 0 });
  const anchor = useRef({ x: 0, y: 0 });
  const ropeLen = useRef(0);

  const released = useRef(false);
  const held = useRef(false);
  const pointer = useRef({ x: 0, y: 0 });
  const grab = useRef({ x: 0, y: 0 });
  const taut = useRef(false);
  const stretch = useRef(0);
  const scrollLift = useRef(0);

  const mountTime = useRef(0);
  const releaseTime = useRef(0);
  const lastTime = useRef(0);
  const accumulator = useRef(0);
  const frame = useRef<number | null>(null);
  const downAt = useRef({ x: 0, y: 0, t: 0, moved: false });
  const tiltTarget = useRef({ x: 0, y: 0, mx: 70, my: 12 });
  const tiltCurrent = useRef({ x: 0, y: 0, mx: 70, my: 12 });

  const [card, setCard] = useState({ w: 244, h: 342 });
  const [flipped, setFlipped] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [photoOk, setPhotoOk] = useState(true);

  // Mirror the measured card size into a ref the RAF loop can read without
  // being a dependency of the loop effect.
  const cardRef = useRef(card);
  useEffect(() => {
    cardRef.current = card;
  }, [card]);

  /* --- Build / rebuild for current stage size --------------------- */

  const build = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    size.current = { w: rect.width, h: rect.height };

    const narrow = rect.width < 760;
    const w = clamp(rect.width * (narrow ? 0.5 : 0.32), narrow ? 176 : 214, 268);
    const h = Math.round(w * 1.4);
    setCard({ w: Math.round(w), h });

    const stage = { w: rect.width, h: rect.height };
    const card = { w: Math.round(w), h };
    const { anchorAt: liveAnchor, ropeLength: liveRope } = carry.current;

    // Anchor sits well above the viewport so the whole card is hidden until
    // it's released, and the attachment point never shows — unless a carrier
    // supplies a visible one, in which case the strap hangs from that.
    anchor.current = liveAnchor
      ? liveAnchor(stage, card)
      : {
          x: rect.width * (anchorRatio ?? (narrow ? 0.5 : 0.68)),
          y: -(h + 120),
        };
    // Rope resolves the card to a little below the vertical middle.
    ropeLen.current = liveRope
      ? liveRope(stage, card)
      : clamp(rect.height * 0.52, 360, 680) + (h + 40);

    // Stack every point at the anchor (above the screen). Coincident segments
    // exert zero constraint force, so the rope can't "spring" — gravity alone
    // draws it out, giving a clean unfurling drop instead of a violent snap.
    const a = anchor.current;
    points.current = Array.from({ length: SEGMENTS + 1 }, (_, i) => ({
      x: a.x,
      y: a.y,
      px: a.x,
      py: a.y,
      locked: i === 0,
    }));
    // Pre-release: pin the tail too, so nothing falls before its cue.
    points.current[SEGMENTS].locked = true;
  }, [anchorRatio]);

  useEffect(() => {
    build();
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(build);
    ro.observe(el);
    return () => ro.disconnect();
  }, [build]);

  /* --- Simulation loop -------------------------------------------- */

  useEffect(() => {
    // The lanyard drop always plays on load — it's driven by rAF, which the
    // OS "reduce motion" setting does not disable. Reduced motion only turns
    // off the continuous idle sway further down.
    const segLen = () => ropeLen.current / SEGMENTS;

    const integrate = (now: number) => {
      const p = points.current;
      if (p.length === 0) return;

      // A carrier moves the hitch every frame; before release the whole rope
      // rides with it, so the drop always starts from where the plane is now.
      const liveAnchor = carry.current.anchorAt;
      if (liveAnchor) {
        const a = liveAnchor(size.current, cardRef.current);
        anchor.current = a;
        if (!released.current) {
          for (let i = 0; i < p.length; i += 1) {
            const pt = p[i];
            pt.x = a.x;
            pt.y = a.y;
            pt.px = a.x;
            pt.py = a.y;
          }
        }
      }

      // Release the tail once the intro delay has elapsed, with a sideways
      // kick so it enters tilted and swings rather than dropping dead-straight.
      if (!released.current && now - mountTime.current > DROP_DELAY) {
        released.current = true;
        releaseTime.current = now;
        const tail = p[SEGMENTS];
        tail.locked = false;
        // A sideways nudge so it enters tilted and swings; gravity owns the
        // fall itself, so no vertical pre-velocity (that would fling it up).
        tail.px = tail.x - 42;
      }
      if (!released.current) return;

      const idle =
        !reduced &&
        now - releaseTime.current > SETTLE_AFTER &&
        !held.current;

      for (let i = 0; i < p.length; i += 1) {
        const pt = p[i];
        if (pt.locked) continue;

        if (held.current && i === p.length - 1) {
          // Follow the pointer with lag (inertia) and rising tension past the
          // rope's reach, so it never snaps rigidly under the cursor.
          const ax = anchor.current.x;
          const ay = anchor.current.y;
          let tx = pointer.current.x - grab.current.x;
          let ty = pointer.current.y - grab.current.y;
          const dx = tx - ax;
          const dy = ty - ay;
          const dist = Math.hypot(dx, dy) || 1e-6;
          const max = ropeLen.current;
          if (dist > max) {
            const over = dist - max;
            const k = (max + over * 0.16) / dist; // resistance beyond reach
            tx = ax + dx * k;
            ty = ay + dy * k;
          }
          pt.px = pt.x;
          pt.py = pt.y;
          pt.x += (tx - pt.x) * 0.32;
          pt.y += (ty - pt.y) * 0.32;
          continue;
        }

        const vx = (pt.x - pt.px) * DAMPING;
        const vy = (pt.y - pt.py) * DAMPING;
        pt.px = pt.x;
        pt.py = pt.y;
        pt.x += vx;
        pt.y += vy + GRAVITY * STEP * STEP;

        if (idle && i === p.length - 1) {
          // Residual life: irregular whisper of sway once at rest.
          pt.x +=
            Math.sin(now * 0.00105) * 0.09 +
            Math.sin(now * 0.00062) * 0.055 +
            Math.sin(now * 0.0021) * 0.025;
        }
      }

      const len = segLen();
      for (let k = 0; k < ITERATIONS; k += 1) {
        p[0].x = anchor.current.x;
        p[0].y = anchor.current.y - scrollLift.current;
        for (let i = 0; i < p.length - 1; i += 1) solve(p[i], p[i + 1], len);
      }

      // Impact: first time the rope pulls taut, stretch the card then snap back.
      const tail = p[SEGMENTS];
      const reach = Math.hypot(
        tail.x - anchor.current.x,
        tail.y - (anchor.current.y - scrollLift.current),
      );
      const vy = tail.y - tail.py;
      if (!taut.current && reach > ropeLen.current * 0.985 && vy > 2) {
        taut.current = true;
        stretch.current = 0.05;
      }
      if (reach < ropeLen.current * 0.9) taut.current = false;
      stretch.current *= 0.86;
    };

    const render = () => {
      const p = points.current;
      if (p.length < 2) return;
      const { w: cw } = cardRef.current;

      // --- Fabric ribbon (filled, tapered, with a centre seam) ---
      const left: string[] = [];
      const right: string[] = [];
      const seam: string[] = [];
      for (let i = 0; i < p.length; i += 1) {
        const a = p[i];
        const b = p[Math.min(i + 1, p.length - 1)];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1e-6;
        dx /= d;
        dy /= d;
        const nx = -dy;
        const ny = dx;
        const w = (STRAP_WIDTH * (0.72 + 0.28 * (i / (p.length - 1)))) / 2;
        left.push(`${(a.x - nx * w).toFixed(2)} ${(a.y - ny * w).toFixed(2)}`);
        right.push(`${(a.x + nx * w).toFixed(2)} ${(a.y + ny * w).toFixed(2)}`);
        seam.push(`${a.x.toFixed(2)} ${a.y.toFixed(2)}`);
      }
      const fillD =
        `M ${left[0]} ` +
        left.slice(1).map((s) => `L ${s}`).join(" ") +
        ` L ${right[right.length - 1]} ` +
        right.slice(0, -1).reverse().map((s) => `L ${s}`).join(" ") +
        " Z";
      strapFill.current?.setAttribute("d", fillD);
      strapWeave.current?.setAttribute("d", fillD);
      strapSeam.current?.setAttribute(
        "d",
        `M ${seam[0]} ` + seam.slice(1).map((s) => `L ${s}`).join(" "),
      );

      // --- Angle from the last taut segment ---
      const tail = p[p.length - 1];
      const prev = p[p.length - 2];
      const angle = (Math.atan2(tail.x - prev.x, tail.y - prev.y) * 180) / Math.PI;

      // --- Connector clip (rotates a touch more than the card) ---
      if (clipRef.current) {
        clipRef.current.style.transform = `translate3d(${tail.x.toFixed(
          2,
        )}px, ${tail.y.toFixed(2)}px, 0) rotate(${(-angle * 1.05).toFixed(2)}deg)`;
      }

      // --- Card body ---
      if (pivotRef.current) {
        const sc = 1 + stretch.current;
        pivotRef.current.style.transform = `translate3d(${(tail.x - cw / 2).toFixed(
          2,
        )}px, ${(tail.y + 14).toFixed(2)}px, 0) rotate(${(-angle).toFixed(
          2,
        )}deg) scaleY(${sc.toFixed(3)})`;
        // Fade in over the first moments of the fall for a softer arrival.
        const fade = released.current
          ? clamp((performance.now() - releaseTime.current) / FADE_MS, 0, 1)
          : 0;
        pivotRef.current.style.opacity = fade.toFixed(3);
      }

      // Soft hover tilt — lerp toward pointer so lean feels silky, not sticky.
      if (flipRef.current) {
        const turn = clamp((tail.x - tail.px) * 1.8, -18, 18);
        flipRef.current.style.setProperty("--swing", `${turn.toFixed(2)}deg`);

        const t = tiltCurrent.current;
        const g = tiltTarget.current;
        const k = held.current ? 1 : 0.14;
        t.x += (g.x - t.x) * k;
        t.y += (g.y - t.y) * k;
        t.mx += (g.mx - t.mx) * k;
        t.my += (g.my - t.my) * k;
        flipRef.current.style.setProperty("--tiltx", `${t.x.toFixed(2)}deg`);
        flipRef.current.style.setProperty("--tilty", `${t.y.toFixed(2)}deg`);
        flipRef.current.style.setProperty("--mx", `${t.mx.toFixed(1)}%`);
        flipRef.current.style.setProperty("--my", `${t.my.toFixed(1)}%`);
      }
    };

    const loop = (now: number) => {
      if (!mountTime.current) mountTime.current = now;
      if (!lastTime.current) lastTime.current = now;
      let delta = (now - lastTime.current) / 1000;
      lastTime.current = now;
      if (delta > 0.1) delta = 0.1;

      accumulator.current += delta;
      let guard = 0;
      while (accumulator.current >= STEP && guard < 12) {
        integrate(now);
        accumulator.current -= STEP;
        guard += 1;
      }
      render();
      frame.current = requestAnimationFrame(loop);
    };

    frame.current = requestAnimationFrame(loop);

    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = null;
      lastTime.current = 0;
      mountTime.current = 0;
    };
  }, [reduced]);

  /* --- Scroll: pull the card up and out of the hero --------------- */

  useEffect(() => {
    // A carrier flies the card out of the hero itself — lifting here too would
    // double the exit.
    if (carried) return;

    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const h = size.current.h || window.innerHeight;
      scrollLift.current = clamp((y / h) * h * 1.15, 0, h * 1.3);
      // Acceleration nudges the card sideways as the page moves.
      const delta = y - lastY;
      lastY = y;
      const p = points.current;
      if (p.length && !held.current) {
        const kick = clamp(delta * 0.05, -5, 5);
        for (let i = 1; i < p.length; i += 1) p[i].px += kick * (i / p.length);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [carried]);

  /* --- Pointer: drag, tilt, flip ---------------------------------- */

  const local = (cx: number, cy: number) => {
    const r = stageRef.current?.getBoundingClientRect();
    return r ? { x: cx - r.left, y: cy - r.top } : { x: 0, y: 0 };
  };

  const onCardPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = points.current;
    if (p.length === 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const l = local(e.clientX, e.clientY);
    const tail = p[p.length - 1];
    grab.current = { x: l.x - tail.x, y: l.y - tail.y };
    pointer.current = l;
    held.current = true;
    downAt.current = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
    setDragging(true);
    window.__lenis?.stop();
  };

  const onCardPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (held.current) {
      pointer.current = local(e.clientX, e.clientY);
      if (Math.hypot(e.clientX - downAt.current.x, e.clientY - downAt.current.y) > 6)
        downAt.current.moved = true;
      return;
    }
    // Hover tilt: gentle 3D lean + moving highlight (lerped in the RAF loop).
    const flip = flipRef.current;
    if (!flip) return;
    const r = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    tiltTarget.current = {
      x: -ny * 14,
      y: nx * 16,
      mx: (nx + 0.5) * 100,
      my: (ny + 0.5) * 100,
    };
  };

  const toggleFlip = () => {
    setFlipping(true);
    setFlipped((f) => !f);
    window.setTimeout(() => setFlipping(false), 760);
  };

  const onCardPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    const wasTap =
      held.current &&
      !downAt.current.moved &&
      performance.now() - downAt.current.t < 320;
    held.current = false;
    setDragging(false);
    window.__lenis?.start();
    if (wasTap) toggleFlip();
  };

  const onCardLeave = () => {
    tiltTarget.current = { x: 0, y: 0, mx: 70, my: 12 };
  };

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      ref={stageRef}
      className="lanyard"
      data-reduced={reduced || undefined}
      data-dragging={dragging || undefined}
      data-flipped={flipped || undefined}
      data-flipping={flipping || undefined}
    >
      <svg className="lanyard__strap" aria-hidden>
        <defs>
          <linearGradient id="strapfill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#071430" />
            <stop offset="22%" stopColor="#1a3568" />
            <stop offset="50%" stopColor="#3d5f9e" />
            <stop offset="78%" stopColor="#1a3568" />
            <stop offset="100%" stopColor="#071430" />
          </linearGradient>
          <pattern
            id="strapweave"
            width="6"
            height="8"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 0 H6 M0 4 H6"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="0.6"
            />
            <path
              d="M1 0 V8 M4 0 V8"
              stroke="rgba(0,0,0,0.12)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <path ref={strapFill} className="lanyard__strap-fill" />
        <path ref={strapWeave} className="lanyard__strap-weave" />
        <path ref={strapSeam} className="lanyard__strap-seam" />
      </svg>

      {/* Connector clip — metal ring + bar */}
      <div ref={clipRef} className="lanyard__clip" aria-hidden>
        <span className="lanyard__ring" />
        <span className="lanyard__bar" />
        <span className="lanyard__rivet" />
      </div>

      {/* Card body (physics owns this transform) */}
      <div
        ref={pivotRef}
        className="lanyard__pivot"
        style={{ width: card.w, height: card.h }}
      >
        <div
          ref={flipRef}
          className="lanyard__flip"
          onPointerDown={onCardPointerDown}
          onPointerMove={onCardPointerMove}
          onPointerUp={onCardPointerUp}
          onPointerCancel={onCardPointerUp}
          onPointerLeave={onCardLeave}
          role="button"
          tabIndex={0}
          aria-label={`${name}, ${role}. Activate to flip the card.`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleFlip();
            }
          }}
        >
          {/* FRONT */}
          <div className="card card--front">
            <span className="card__foil" aria-hidden />
            <span className="card__sheen" aria-hidden />
            <span className="card__notch" aria-hidden />
            <span className="card__holo" aria-hidden />
            <div className="card__head">
              <span className="card__kicker">
                <span className="card__pulse" aria-hidden />
                Available
              </span>
              <span className="card__reg" aria-hidden>
                ⌖
              </span>
            </div>

            <div className="card__photo">
              {photoOk ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={photoSrc}
                  alt=""
                  draggable={false}
                  onError={() => setPhotoOk(false)}
                />
              ) : (
                <span className="card__initials">{initials}</span>
              )}
              <span className="card__grid" aria-hidden />
              <span className="card__vignette" aria-hidden />
              <span className="card__coord" aria-hidden>
                24.59°N · 73.71°E
              </span>
            </div>

            <div className="card__id">
              <p className="card__name">{name}</p>
              <p className="card__roles">Art Designer · Graphic Designer</p>
            </div>

            <ul className="card__tags" aria-hidden>
              <li>Identity</li>
              <li>Editorial</li>
              <li>Visual</li>
            </ul>

            <div className="card__stamp" aria-hidden>
              Studio
            </div>

            <div className="card__foot">
              <span className="card__no">Identity 001</span>
              <div className="card__barcode" aria-hidden>
                {Array.from({ length: 30 }).map((_, i) => (
                  <span key={i} style={{ ["--w" as string]: (i % 4) + 1 }} />
                ))}
              </div>
              <span className="card__year">’26</span>
            </div>
          </div>

          {/* BACK */}
          <div className="card card--back">
            <span className="card__foil" aria-hidden />
            <span className="card__sheen" aria-hidden />
            <span className="card__notch" aria-hidden />
            <div className="card__head">
              <span className="card__kicker">Available for</span>
              <span className="card__reg" aria-hidden>
                ✦
              </span>
            </div>

            <ul className="card__services">
              <li>Branding</li>
              <li>Editorial</li>
              <li>Art Direction</li>
              <li>Digital</li>
            </ul>

            <div className="card__contact">
              <a href={`mailto:${email}`} onClick={(e) => e.stopPropagation()}>
                {email}
              </a>
              <div className="card__socials">
                {SOCIALS.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            </div>

            <div className="card__cta">
              <span>Let’s create</span>
              <span aria-hidden>→</span>
            </div>

            <div className="card__foot card__foot--back">
              <span className="card__no">
                {location} · {location === "IN" ? "India" : location}
              </span>
              <span className="card__year">’26</span>
            </div>
          </div>
        </div>
      </div>

      <p className="lanyard__hint" aria-hidden>
        drag · click to flip
      </p>
    </div>
  );
}
