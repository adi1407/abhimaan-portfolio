"use client";

import { useEffect, useRef, useState } from "react";
import { useFlight } from "@/features/home/components/flight-context";
import {
  PLANE_HITCH,
  PLANE_TAIL,
  PLANE_VIEWBOX,
  PaperPlane,
} from "@/features/home/components/paper-plane";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/* ================================================================== *
 * Paper flight
 *
 * One plane for the whole home page. It holds a slot in the hero with
 * the ID card hitched to its underbelly, releases the card as the hero
 * ends, then crosses every section below on a single continuous path:
 * each leg starts exactly where the last one finished, off-screen at a
 * viewport edge, so there is never a cut. It lands beside the contact
 * call to action rather than fading out.
 * ================================================================== */

const ASPECT = PLANE_VIEWBOX.h / PLANE_VIEWBOX.w;

const ENTRY_MS = 1150;
/** Fraction of the hero leg the plane holds its slot before banking away. */
const HERO_HOLD = 0.62;
/**
 * Where in the hero leg the card is let go. The plane holds station while the
 * page scrolls under it, so the card is dragged down its own stage box —
 * release has to happen before it reaches the hero's clipped bottom edge.
 */
const RELEASE_AT = 0.66;
/** Where in the final leg the plane starts settling into its park. */
const PARK_FROM = 0.7;

const CRUISE_SCALE = 0.62;
const PARK_SCALE = 0.72;

/** How fast the pointer-drift and idle wobble converge, in 1/seconds — a
 *  rate rather than a fixed per-frame step, so it feels identical at any
 *  frame rate instead of drifting slower on a throttled or variable-refresh
 *  display. */
const DRIFT_RATE = 3.4;
/** Duration of the origin-shard's flight, and how long the tail's answering
 *  highlight holds once it lands. */
const SHARD_MS = 560;
const TAIL_FLASH_MS = 420;

/**
 * How quickly the flight's "mode" leans into reverse once the visitor starts
 * scrolling up, and back out once they scroll down again — a rate, not a
 * snap, so changing direction mid-gesture bends the path rather than
 * popping it. ~0.6s to fully commit either way.
 */
const DIR_BLEND_RATE = 1.8;
/** Below this scroll delta (px/frame-ish), direction is "holding", not
 *  reversing — keeps the mode from flickering while nearly stationary. */
const DIR_DEADZONE = 0.6;

/** Idle: stop scrolling for this long and the plane recedes; scroll again
 *  and it's back. Never applies while the plane still holds the card — a
 *  hitch with nothing visibly holding it would read as broken, not restful. */
const IDLE_MS = 850;
const IDLE_FADE_RATE = 2.8;

/** Altitudes the path passes through, as fractions of the viewport height.
 *  Leg j runs ALT[j] to ALT[j + 1], so consecutive legs share an endpoint. */
const ALT = [0.22, 0.66, 0.3, 0.7, 0.36];
/** Arc height of each crossing, alternating so the path snakes. */
const ARC = 0.045;
/** How far past the edge a leg starts and ends, as a fraction of width. */
const OUT = 0.16;

/**
 * Zigzag overlay: full up/down cycles per crossing, and how far each cycle
 * swings (fraction of vh). Driven by `globalT = leg index + progress within
 * leg`, a value that only ever increases, so `sin(2π · ZIGZAG_FREQ · globalT)`
 * is exactly 0 every time globalT lands on an integer — i.e. at every leg
 * boundary — which is what keeps the path seamless leg to leg without having
 * to hand-match phases.
 */
const ZIGZAG_FREQ = 2;
const ZIGZAG_AMP = 0.06;
/** Keep the wave off the navbar and out of the footer regardless of ALT. */
const ALT_MIN = 0.09;
const ALT_MAX = 0.9;

/**
 * The return trip reads differently, not as the outbound path played
 * backward: the zigzag all but disappears (a near-straight glide) and the
 * bow softens and leans the other way — a calmer "coming home" rather than
 * the energetic outbound saw-tooth. Both multipliers land on terms that are
 * mathematically zero at every leg boundary regardless of their value (see
 * cruisePose), so blending them via `dirBlend` can never introduce a pop.
 */
const REVERSE_ZIGZAG_SCALE = 0.12;
const REVERSE_ARC_SCALE = -0.7;

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

/** The card's own width formula, mirrored so the hero slot can clear it. */
function cardWidth(vw: number) {
  const narrow = vw < 760;
  return clamp(vw * (narrow ? 0.5 : 0.32), narrow ? 176 : 214, 268);
}

/** Where the plane hangs in the hero: right gutter (card clearance on desktop). */
function heroSlot(vw: number, vh: number, pw: number): Pose {
  /* Mobile has no ID card — park the plane cleanly in the upper-right. */
  if (vw < 900) {
    return {
      cx: vw * 0.78,
      cy: Math.max(vh * 0.18, 96),
      roll: -10,
      scale: 0.9,
      facing: 1,
    };
  }
  const clearance = vw - cardWidth(vw) / 2 - 12 + (0.5 - PLANE_HITCH.x) * pw;
  return {
    cx: Math.min(vw * 0.82, clearance),
    cy: vh * 0.26,
    roll: -7,
    scale: 1,
    facing: 1,
  };
}

/**
 * A crossing. Legs alternate direction, so the path never has to jump back.
 * Vertical motion is the base altitude drift (one gentle bow) with a zigzag
 * riding on top — two full up/down swings per crossing — so the plane
 * visibly saws its way across rather than gliding a single smooth arc.
 *
 * `dirBlend` is +1 for forward (outbound) scrolling, -1 for reverse, and
 * anything smoothly in between while the visitor is changing their mind —
 * it damps the zigzag and softens/flips the bow so the return trip reads as
 * a different, calmer flight rather than the same one rewound.
 */
function cruisePose(
  j: number,
  t: number,
  vw: number,
  vh: number,
  dirBlend: number,
): Pose {
  const dir = j % 2 === 0 ? -1 : 1;
  const xs = (dir === -1 ? 1 + OUT : -OUT) * vw;
  const xe = (dir === -1 ? -OUT : 1 + OUT) * vw;
  const a0 = ALT[j % ALT.length];
  const a1 = ALT[(j + 1) % ALT.length];
  const arcBase = ARC * (j % 2 === 0 ? -1 : 1);

  // 0 when fully forward, 1 when fully reverse.
  const revMix = (1 - dirBlend) / 2;
  const arcEff = arcBase * lerp(1, REVERSE_ARC_SCALE, revMix);
  const zigAmpEff = ZIGZAG_AMP * lerp(1, REVERSE_ZIGZAG_SCALE, revMix);

  const cx = lerp(xs, xe, t);

  // globalT only ever increases, so this term is exactly 0 at every leg
  // boundary (t=0 and t=1) — the zigzag never has to be phase-matched by
  // hand, and scaling its amplitude by revMix can't break that: anything
  // times zero is still zero.
  const globalT = j + t;
  const wave = ZIGZAG_FREQ * Math.PI * 2 * globalT;
  const zig = zigAmpEff * Math.sin(wave);

  // arcEff * sin(π·t) is also exactly 0 at t=0 and t=1 regardless of
  // arcEff's value, so re-scaling/flipping it per direction is equally safe.
  const baseAlt = lerp(a0, a1, smooth(t)) + arcEff * Math.sin(Math.PI * t);
  const cy = clamp(baseAlt + zig, ALT_MIN, ALT_MAX) * vh;

  // Bank from the path's own slope, not the frame's — identical at any
  // scroll speed, and the shared endpoints keep it continuous across legs.
  const dx = xe - xs;
  const dAlt = (a1 - a0) * dSmooth(t) + arcEff * Math.PI * Math.cos(Math.PI * t);
  const dZig = zigAmpEff * ZIGZAG_FREQ * Math.PI * 2 * Math.cos(wave);
  const dy = (dAlt + dZig) * vh;

  const facing = dx >= 0 ? 1 : -1;
  const tilt = clamp(
    (Math.atan2(dy * 2.4, Math.abs(dx)) * 180) / Math.PI,
    -26,
    26,
  );

  return { cx, cy, roll: facing * tilt, scale: CRUISE_SCALE, facing };
}

/** Phones drop the plane entirely — see the note on `mobile` below. */
const MOBILE_MQ = "(max-width: 900px)";

export function PaperFlight() {
  const reduced = useReducedMotion();
  const flight = useFlight();

  /* The flight is a desktop flourish. On a phone it crowds the content it
     flies over, and the physics loop plus its listeners are pure cost on
     the device least able to absorb them — so it is not rendered at all
     rather than merely hidden with CSS. */
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const layerRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);

  const plane = useRef({ w: 0, h: 0 });
  const drift = useRef({ x: 0, y: 0, roll: 0 });
  const pointer = useRef({ x: 0, y: 0, roll: 0 });

  useEffect(() => {
    if (mobile) return;
    const layer = layerRef.current;
    const body = planeRef.current;
    if (!layer || !body) return;

    // Plane can sit as a sibling of <main> (fixed overlay) — don't rely on
    // closest("main") from the layer, which is null in that layout.
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

    /** A point fixed to the plane (e.g. the hitch or the tail hinge), in
     *  viewport space, given the plane's current pose. Shared by `publish`
     *  (the card's hitch) and the origin-shard flourish (hitch → tail). */
    const planePoint = (pose: Pose, frac: { x: number; y: number }) => {
      const { w: pw, h: ph } = plane.current;
      const vx = (frac.x - 0.5) * pw * pose.scale;
      const vy = (frac.y - 0.5) * ph * pose.scale;
      const a = (pose.roll * Math.PI) / 180;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      return { x: pose.cx + vx * cos - vy * sin, y: pose.cy + vx * sin + vy * cos };
    };

    const publish = (pose: Pose, docOffset: number, carrying: boolean) => {
      if (!flight) return;
      const hitch = planePoint(pose, PLANE_HITCH);
      // Document coordinates, so the hero's card can subtract its own offset.
      flight.set({ x: hitch.x, y: hitch.y + docOffset, carrying, ready: true });
    };

    const write = (pose: Pose, opacity: number, flutter: number) => {
      const { w: pw, h: ph } = plane.current;
      body.style.transform =
        `translate3d(${(pose.cx - pw / 2).toFixed(2)}px, ${(
          pose.cy -
          ph / 2
        ).toFixed(2)}px, 0) rotate(${pose.roll.toFixed(2)}deg) ` +
        `perspective(700px) rotateY(${flutter.toFixed(2)}deg) scaleX(${pose.facing})`;
      body.style.opacity = opacity.toFixed(3);
    };

    /**
     * The origin-shard: at the exact frame the plane lets go of the card, a
     * small paper fragment tears from the hitch point and flies to the
     * tail — the plane visibly gaining the piece the card just gave up,
     * rather than the two objects simply drifting apart unrelated. One-shot,
     * imperative (no React state) so it never costs a render.
     */
    const spawnShard = (pose: Pose) => {
      if (!layer) return;
      const start = planePoint(pose, PLANE_HITCH);
      const end = planePoint(pose, PLANE_TAIL);
      const dx = end.x - start.x;
      const dy = end.y - start.y;

      const el = document.createElement("span");
      el.className = "pp-shard";
      el.style.left = `${start.x.toFixed(1)}px`;
      el.style.top = `${start.y.toFixed(1)}px`;
      layer.appendChild(el);

      const anim = el.animate(
        [
          { transform: "translate(0px, 0px) scale(1) rotate(-10deg)", opacity: 0 },
          {
            transform: `translate(${(dx * 0.42).toFixed(1)}px, ${(dy * 0.3).toFixed(1)}px) scale(0.9) rotate(65deg)`,
            opacity: 1,
            offset: 0.24,
          },
          {
            transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(0.2) rotate(200deg)`,
            opacity: 0,
          },
        ],
        { duration: SHARD_MS, easing: "cubic-bezier(0.22, 0.68, 0.16, 1)", fill: "forwards" },
      );

      const cleanup = () => {
        el.remove();
        body.classList.add("is-arriving");
        window.setTimeout(() => body.classList.remove("is-arriving"), TAIL_FLASH_MS);
      };
      anim.onfinish = cleanup;
      // If the tab is backgrounded mid-flight, WAAPI can leave the element
      // orphaned instead of firing `finish` — make sure it's cleared either way.
      anim.oncancel = () => el.remove();
    };

    /*
     * The cross-page cruise is driven entirely by scroll position (`t` below
     * comes from where each section sits under the viewport centre), which
     * makes it direct manipulation rather than automatic motion — the same
     * reasoning that keeps the film scrub and the toolbox cubes live under
     * prefers-reduced-motion elsewhere on this site. What DOES get cut under
     * reduced motion is the *ambient* stuff layered on top: the continuous
     * wing flutter, the idle hero bob, and the pointer-follow drift — none of
     * those are tied to anything the visitor did, so they're the part the
     * preference actually exists to suppress.
     */

    let frame: number | null = null;
    let entryStart = 0;
    let lastNow = 0;
    // Starts true: the card is hitched from the very first frame.
    let wasCarrying = true;

    // Direction blend: +1 forward, -1 reverse, eased between. Starts forward
    // since the journey always begins by scrolling down out of the hero.
    let lastScrollY = window.scrollY;
    let dirTarget = 1;
    let dirBlend = 1;

    // Idle fade: how long since the scroll position actually changed, and
    // the current (smoothed) visibility multiplier that answers it.
    let lastMoveTime = 0;
    let idleFade = 1;

    const onPointerMove = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      pointer.current = { x: nx * 26, y: ny * 18, roll: nx * 5 - ny * 2.5 };
    };

    const step = (now: number) => {
      if (!entryStart) entryStart = now;
      // Real elapsed time, not an assumed frame budget — everything lerped
      // below converges at the same real-world speed at 30fps, 60fps, or a
      // throttled background tab, instead of speeding up or crawling with it.
      const dt = lastNow ? Math.min((now - lastNow) / 1000, 0.1) : 1 / 60;
      lastNow = now;

      // Direction: a clear scroll delta updates the target; near-zero delta
      // (stationary, or a sub-pixel wobble) holds whatever direction was last
      // established rather than snapping to neutral. The blend itself always
      // eases toward that target, so a reversal bends the path, never pops it.
      const sy = window.scrollY;
      const scrollDelta = sy - lastScrollY;
      lastScrollY = sy;
      if (scrollDelta > DIR_DEADZONE) dirTarget = 1;
      else if (scrollDelta < -DIR_DEADZONE) dirTarget = -1;
      const dirK = 1 - Math.exp(-dt * DIR_BLEND_RATE);
      dirBlend += (dirTarget - dirBlend) * dirK;

      // Idle: any real movement resets the clock; once it's been quiet for
      // IDLE_MS, fade the plane out (see the carrying guard further below —
      // it never fades while the card is still hitched to it).
      if (!lastMoveTime) lastMoveTime = now;
      if (Math.abs(scrollDelta) > 0.4) lastMoveTime = now;
      const idle = now - lastMoveTime > IDLE_MS;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const focus = vh * 0.5;
      const scrolled = window.scrollY;
      const { w: pw } = plane.current;

      // Which section owns the middle of the screen? Index 0 is the hero.
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

      let opacity = 1;
      if (active === -1) {
        // Above the hero, or past the last section into the footer.
        const first = sections[0].getBoundingClientRect();
        if (focus < first.top) {
          active = 0;
          t = 0;
        } else {
          const lastRect = sections[sections.length - 1].getBoundingClientRect();
          active = sections.length - 1;
          t = 1;
          opacity = 1 - smooth(clamp((focus - lastRect.bottom) / (vh * 0.7), 0, 1));
        }
      }

      // Ambient only: continuous, time-based, unrelated to scroll or input —
      // exactly what reduced motion should strip out.
      const flutter = reduced ? 0 : Math.sin(now * 0.0009) * (active === 0 ? 4 : 9);
      let pose: Pose;
      let carrying = false;

      if (active === 0) {
        // Hero: hold the slot, then bank away into the first crossing. The
        // exit interpolates to that leg's exact start, so nothing jumps.
        const slot = heroSlot(vw, vh, pw);
        const k = smooth(clamp((t - HERO_HOLD) / (1 - HERO_HOLD), 0, 1));
        const live = 1 - k;

        // Also ambient: the one-time swoop-in plays from mount regardless of
        // scroll, and the bob/pointer-drift are idle chrome — all skipped
        // under reduced motion so the plane simply sits in its slot until
        // the visitor's own scroll starts moving it.
        const e = reduced
          ? 0
          : 1 - easeOut(clamp((now - entryStart) / ENTRY_MS, 0, 1));
        const bobX = reduced ? 0 : Math.sin(now * 0.00037) * 9 + Math.sin(now * 0.00081) * 3;
        const bobY = reduced ? 0 : Math.sin(now * 0.00055) * 11 + Math.sin(now * 0.00104) * 3.5;
        const bobRoll = reduced ? 0 : Math.sin(now * 0.00045) * 2.4;

        // Exponential convergence at a fixed real-time rate (see DRIFT_RATE)
        // rather than a fixed per-frame fraction — the old `* 0.055` was
        // implicitly tuned for 60fps and would drift at the wrong speed
        // anywhere else.
        const driftK = 1 - Math.exp(-dt * DRIFT_RATE);
        const d = drift.current;
        const p = pointer.current;
        d.x += (p.x - d.x) * driftK;
        d.y += (p.y - d.y) * driftK;
        d.roll += (p.roll - d.roll) * driftK;

        const held: Pose = {
          cx: slot.cx + (bobX + d.x + e * vw * 0.25) * live,
          cy: slot.cy + (bobY + d.y - e * vh * 0.12) * live,
          roll: slot.roll + (bobRoll + d.roll + e * 12) * live,
          scale: slot.scale - e * 0.08 * live,
          facing: 1,
        };
        const handoff = cruisePose(0, 0, vw, vh, dirBlend);

        pose = {
          cx: lerp(held.cx, handoff.cx, k),
          cy: lerp(held.cy, handoff.cy, k),
          roll: lerp(held.roll, handoff.roll, k),
          scale: lerp(held.scale, handoff.scale, k),
          facing: 1,
        };
        /* No ID card on phones — never claim a hitch. */
        carrying = vw >= 900 && t < RELEASE_AT;

        // The exact frame the card lets go — fire the origin-shard once.
        // Guarded by !reduced: it's a one-shot narrative flourish, not part
        // of the core cross-page storytelling, so it stays off when the
        // visitor has asked for less motion (scrolling back up re-arms it,
        // same as the release itself un-freezing in HeroCargo).
        if (wasCarrying && !carrying && !reduced) {
          spawnShard(pose);
        }
        wasCarrying = carrying;
      } else {
        const j = active - 1;
        pose = cruisePose(j, t, vw, vh, dirBlend);

        // Last leg lands instead of leaving.
        if (active === sections.length - 1 && t > PARK_FROM) {
          const q = smooth(clamp((t - PARK_FROM) / (1 - PARK_FROM), 0, 1));
          pose = {
            cx: lerp(pose.cx, vw * 0.86, q),
            cy: lerp(pose.cy, vh * 0.34, q),
            roll: lerp(pose.roll, 0, q),
            scale: lerp(pose.scale, PARK_SCALE, q),
            facing: pose.facing,
          };
        }
      }

      // Recede when idle — but never while the card is still hitched to the
      // plane; an invisible sprite with a lanyard trailing to nowhere would
      // read as broken, not restful.
      const idleTarget = idle && !carrying ? 0 : 1;
      const idleK = 1 - Math.exp(-dt * IDLE_FADE_RATE);
      idleFade += (idleTarget - idleFade) * idleK;

      write(pose, opacity * idleFade, flutter);
      publish(pose, scrolled, carrying);

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
    // Pointer-follow drift is ambient, not scroll-driven — only listen when
    // it'll actually be used.
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
  }, [flight, reduced, mobile]);

  /* Nothing rendered on phones — no overlay node, no plane, no shards. */
  if (mobile) return null;

  return (
    <div ref={layerRef} className="paper-flight" aria-hidden>
      <div ref={planeRef} className="paper-flight__body">
        <PaperPlane className="paper-plane--flight" />
      </div>
    </div>
  );
}
