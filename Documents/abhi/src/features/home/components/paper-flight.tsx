"use client";

import { useEffect, useRef } from "react";
import {
  PLANE_VIEWBOX,
  PaperPlane,
} from "@/features/home/components/paper-plane";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/* ================================================================== *
 * Paper flight
 *
 * One plane for the whole home page — no ID card. It holds a slot in
 * the hero, then crosses every section on a continuous path and parks
 * beside contact. Soft on phones: smaller, gentler zig, lower opacity.
 * ================================================================== */

const ASPECT = PLANE_VIEWBOX.h / PLANE_VIEWBOX.w;

const ENTRY_MS = 1280;
/** Fraction of the hero leg the plane holds its slot before banking away. */
const HERO_HOLD = 0.58;
/** Where in the final leg the plane starts settling into its park. */
const PARK_FROM = 0.72;

const CRUISE_SCALE = 0.58;
const PARK_SCALE = 0.68;

const DRIFT_RATE = 3.2;
const DIR_BLEND_RATE = 1.6;
const DIR_DEADZONE = 0.6;

/** Idle: stop scrolling for this long and the plane softens away. */
const IDLE_MS = 1100;
const IDLE_FADE_RATE = 2.2;

const ALT = [0.2, 0.62, 0.28, 0.66, 0.34];
const ARC = 0.038;
const OUT = 0.14;

const ZIGZAG_FREQ = 1.75;
const ZIGZAG_AMP = 0.045;
const ALT_MIN = 0.1;
const ALT_MAX = 0.88;

const REVERSE_ZIGZAG_SCALE = 0.1;
const REVERSE_ARC_SCALE = -0.65;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
const dSmooth = (t: number) => 6 * t * (1 - t);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

type Pose = {
  cx: number;
  cy: number;
  roll: number;
  scale: number;
  facing: number;
};

/** Hero parking spot — upper-right, clear of the wordmark. */
function heroSlot(vw: number, vh: number): Pose {
  const narrow = vw < 900;
  return {
    cx: vw * (narrow ? 0.82 : 0.78),
    cy: Math.max(vh * (narrow ? 0.16 : 0.24), narrow ? 88 : 110),
    roll: narrow ? -8 : -6,
    scale: narrow ? 0.82 : 1,
    facing: 1,
  };
}

/**
 * A crossing. Legs alternate direction so the path never jumps.
 * `dirBlend` (+1 forward / -1 reverse) softens zigzag on the return.
 */
function cruisePose(
  j: number,
  t: number,
  vw: number,
  vh: number,
  dirBlend: number,
  zigScale: number,
): Pose {
  const dir = j % 2 === 0 ? -1 : 1;
  const xs = (dir === -1 ? 1 + OUT : -OUT) * vw;
  const xe = (dir === -1 ? -OUT : 1 + OUT) * vw;
  const a0 = ALT[j % ALT.length];
  const a1 = ALT[(j + 1) % ALT.length];
  const arcBase = ARC * (j % 2 === 0 ? -1 : 1);

  const revMix = (1 - dirBlend) / 2;
  const arcEff = arcBase * lerp(1, REVERSE_ARC_SCALE, revMix);
  const zigAmpEff = ZIGZAG_AMP * zigScale * lerp(1, REVERSE_ZIGZAG_SCALE, revMix);

  const cx = lerp(xs, xe, t);
  const globalT = j + t;
  const wave = ZIGZAG_FREQ * Math.PI * 2 * globalT;
  const zig = zigAmpEff * Math.sin(wave);

  const baseAlt = lerp(a0, a1, smooth(t)) + arcEff * Math.sin(Math.PI * t);
  const cy = clamp(baseAlt + zig, ALT_MIN, ALT_MAX) * vh;

  const dx = xe - xs;
  const dAlt = (a1 - a0) * dSmooth(t) + arcEff * Math.PI * Math.cos(Math.PI * t);
  const dZig = zigAmpEff * ZIGZAG_FREQ * Math.PI * 2 * Math.cos(wave);
  const dy = (dAlt + dZig) * vh;

  const facing = dx >= 0 ? 1 : -1;
  const tilt = clamp(
    (Math.atan2(dy * 2.2, Math.abs(dx)) * 180) / Math.PI,
    -22,
    22,
  );

  return {
    cx,
    cy,
    roll: facing * tilt,
    scale: CRUISE_SCALE * (vw < 900 ? 0.88 : 1),
    facing,
  };
}

export function PaperFlight() {
  const reduced = useReducedMotion();
  const layerRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);

  const plane = useRef({ w: 0, h: 0 });
  const drift = useRef({ x: 0, y: 0, roll: 0 });
  const pointer = useRef({ x: 0, y: 0, roll: 0 });

  useEffect(() => {
    const layer = layerRef.current;
    const body = planeRef.current;
    if (!layer || !body) return;

    const main =
      layer.closest("main") ??
      document.querySelector<HTMLElement>("main.home-page") ??
      document.querySelector("main");
    const sections = Array.from(
      main?.querySelectorAll<HTMLElement>(":scope > section") ?? [],
    );
    if (sections.length === 0) return;

    const measure = () => {
      const w = body.offsetWidth;
      plane.current = { w, h: w * ASPECT };
    };
    measure();

    const write = (pose: Pose, opacity: number, flutter: number) => {
      const { w: pw, h: ph } = plane.current;
      body.style.transform =
        `translate3d(${(pose.cx - pw / 2).toFixed(2)}px, ${(
          pose.cy -
          ph / 2
        ).toFixed(2)}px, 0) rotate(${pose.roll.toFixed(2)}deg) ` +
        `perspective(700px) rotateY(${flutter.toFixed(2)}deg) scaleX(${pose.facing}) ` +
        `scale(${pose.scale.toFixed(3)})`;
      body.style.opacity = opacity.toFixed(3);
    };

    let frame: number | null = null;
    let entryStart = 0;
    let lastNow = 0;
    let lastScrollY = window.scrollY;
    let dirTarget = 1;
    let dirBlend = 1;
    let lastMoveTime = 0;
    let idleFade = 1;

    const onPointerMove = (e: PointerEvent) => {
      /* Touch pointers get a lighter drift so the plane doesn't chase a finger. */
      const touch = e.pointerType === "touch";
      const ampX = touch ? 10 : 22;
      const ampY = touch ? 7 : 15;
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      pointer.current = {
        x: nx * ampX,
        y: ny * ampY,
        roll: nx * (touch ? 2.5 : 4.5) - ny * (touch ? 1.2 : 2),
      };
    };

    const step = (now: number) => {
      if (!entryStart) entryStart = now;
      const dt = lastNow ? Math.min((now - lastNow) / 1000, 0.1) : 1 / 60;
      lastNow = now;

      const sy = window.scrollY;
      const scrollDelta = sy - lastScrollY;
      lastScrollY = sy;
      if (scrollDelta > DIR_DEADZONE) dirTarget = 1;
      else if (scrollDelta < -DIR_DEADZONE) dirTarget = -1;
      const dirK = 1 - Math.exp(-dt * DIR_BLEND_RATE);
      dirBlend += (dirTarget - dirBlend) * dirK;

      if (!lastMoveTime) lastMoveTime = now;
      if (Math.abs(scrollDelta) > 0.4) lastMoveTime = now;
      const idle = now - lastMoveTime > IDLE_MS;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const narrow = vw < 900;
      const zigScale = narrow ? 0.55 : 1;
      const focus = vh * 0.5;
      const scrolledOpacityCap = narrow ? 0.72 : 1;

      let active = -1;
      let t = 0;
      for (let i = 0; i < sections.length; i += 1) {
        const rect = sections[i].getBoundingClientRect();
        if (rect.height <= 0) continue;
        const local = (focus - rect.top) / rect.height;
        if (local >= 0 && local <= 1) {
          active = i;
          t = local;
          break;
        }
      }

      let opacity = scrolledOpacityCap;
      if (active === -1) {
        const first = sections[0].getBoundingClientRect();
        if (focus < first.top) {
          active = 0;
          t = 0;
        } else {
          const lastRect = sections[sections.length - 1].getBoundingClientRect();
          active = sections.length - 1;
          t = 1;
          opacity =
            scrolledOpacityCap *
            (1 - smooth(clamp((focus - lastRect.bottom) / (vh * 0.7), 0, 1)));
        }
      }

      const flutter = reduced ? 0 : Math.sin(now * 0.00085) * (active === 0 ? 3.5 : 7.5);
      let pose: Pose;

      if (active === 0) {
        const slot = heroSlot(vw, vh);
        const k = smooth(clamp((t - HERO_HOLD) / (1 - HERO_HOLD), 0, 1));
        const live = 1 - k;

        const e = reduced
          ? 0
          : 1 - easeOut(clamp((now - entryStart) / ENTRY_MS, 0, 1));
        const bobX = reduced
          ? 0
          : Math.sin(now * 0.00035) * (narrow ? 5 : 8) +
            Math.sin(now * 0.00078) * (narrow ? 2 : 2.8);
        const bobY = reduced
          ? 0
          : Math.sin(now * 0.0005) * (narrow ? 6 : 10) +
            Math.sin(now * 0.00098) * (narrow ? 2 : 3.2);
        const bobRoll = reduced
          ? 0
          : Math.sin(now * 0.00042) * (narrow ? 1.6 : 2.2);

        const driftK = 1 - Math.exp(-dt * DRIFT_RATE);
        const d = drift.current;
        const p = pointer.current;
        d.x += (p.x - d.x) * driftK;
        d.y += (p.y - d.y) * driftK;
        d.roll += (p.roll - d.roll) * driftK;

        const held: Pose = {
          cx: slot.cx + (bobX + d.x + e * vw * 0.22) * live,
          cy: slot.cy + (bobY + d.y - e * vh * 0.1) * live,
          roll: slot.roll + (bobRoll + d.roll + e * 10) * live,
          scale: slot.scale - e * 0.06 * live,
          facing: 1,
        };
        const handoff = cruisePose(0, 0, vw, vh, dirBlend, zigScale);

        pose = {
          cx: lerp(held.cx, handoff.cx, k),
          cy: lerp(held.cy, handoff.cy, k),
          roll: lerp(held.roll, handoff.roll, k),
          scale: lerp(held.scale, handoff.scale, k),
          facing: 1,
        };
      } else {
        const j = active - 1;
        pose = cruisePose(j, t, vw, vh, dirBlend, zigScale);

        if (active === sections.length - 1 && t > PARK_FROM) {
          const q = smooth(clamp((t - PARK_FROM) / (1 - PARK_FROM), 0, 1));
          pose = {
            cx: lerp(pose.cx, vw * (narrow ? 0.88 : 0.86), q),
            cy: lerp(pose.cy, vh * (narrow ? 0.28 : 0.34), q),
            roll: lerp(pose.roll, 0, q),
            scale: lerp(pose.scale, PARK_SCALE * (narrow ? 0.9 : 1), q),
            facing: pose.facing,
          };
        }
      }

      const idleTarget = idle ? 0.12 : 1;
      const idleK = 1 - Math.exp(-dt * IDLE_FADE_RATE);
      idleFade += (idleTarget - idleFade) * idleK;

      write(pose, opacity * idleFade, flutter);
      frame = requestAnimationFrame(step);
    };

    const play = () => {
      if (frame === null) frame = requestAnimationFrame(step);
    };
    const pause = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    };
    const onVisibility = () => (document.hidden ? pause() : play());

    const ro = new ResizeObserver(measure);
    ro.observe(body);
    if (!reduced) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibility);
    play();

    return () => {
      pause();
      ro.disconnect();
      if (!reduced) {
        window.removeEventListener("pointermove", onPointerMove);
      }
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced]);

  return (
    <div ref={layerRef} className="paper-flight" aria-hidden>
      <div ref={planeRef} className="paper-flight__body">
        <PaperPlane className="paper-plane--flight" />
      </div>
    </div>
  );
}
