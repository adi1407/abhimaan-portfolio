"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "@/hooks/use-in-view";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";

/* ================================================================== *
 * Footer wordmark — cursor flashlight
 *
 * The plate is white type-on-black in `mix-blend-mode: lighten`, so the
 * glyphs are windows onto whatever is painted behind them. At rest that
 * is the video, everywhere. On hover an ink layer slides in between and
 * a soft hole in it trails the cursor, so the clip survives only inside
 * the beam while the rest of the letters read as deep ink.
 * ================================================================== */

const WORDMARK = "ABHIMAAN";
const WORDMARK_VIDEO = "/i_want_a_video_b_f_d_in_this.mp4";

/** Beam radius on hover, in px, against viewport width. */
const BEAM_MIN = 180;
const BEAM_MAX = 430;
const BEAM_VW = 0.22;
/** How hard the beam chases the pointer, per frame. */
const POS_LERP = 0.16;
const RADIUS_LERP = 0.1;
/** Letters react a little wider than the light itself. */
const MAGNET_SCALE = 1.15;

const LIFT_EM = 0.06;
const PUSH = 0.05;
const SCALE = 0.07;
const TILT_DEG = 3;
/**
 * Resting weight matches the CSS so nothing pops when the loop takes over.
 * While the beam is on, letters outside it thin out and letters inside it
 * swell, which is what makes the lit ones read as lit.
 */
const WGHT_REST = 800;
const WGHT_DIM = 80;
const WGHT_GAIN = 180;

/** Spring feel for the per-letter response. */
const APPROACH_K = 0.16;
const RELEASE_K_NEAR = 0.13;
const RELEASE_K_FAR = 0.05;
const DAMPING = 0.74;
const QUIET = 0.0005;

/** Video speeds up a touch while the beam is on. */
const RATE_REST = 1;
const RATE_LIT = 1.4;
const HEAT_LERP = 0.08;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const hoverRadius = () =>
  clamp(window.innerWidth * BEAM_VW, BEAM_MIN, BEAM_MAX);

export function FooterWordmark() {
  const reduced = useReducedMotion();
  const { ref: markRef, inView } = useInView<HTMLDivElement>({
    threshold: 0.12,
    rootMargin: "0px 0px -4% 0px",
    once: false,
  });
  const [revealed, setRevealed] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<(HTMLSpanElement | null)[]>([]);

  if (inView && !revealed) {
    setRevealed(true);
  }

  /* --- Video: plays only while the mark is on screen ---------------- */

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
    video.playsInline = true;

    const tryPlay = () => {
      void video.play().catch(() => {});
    };

    if (inView) tryPlay();
    else video.pause();

    video.addEventListener("canplay", tryPlay);
    video.addEventListener("loadeddata", tryPlay);
    return () => {
      video.removeEventListener("canplay", tryPlay);
      video.removeEventListener("loadeddata", tryPlay);
    };
  }, [inView]);

  /* --- The flashlight ----------------------------------------------- */

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const letters = lettersRef.current.filter(
      (el): el is HTMLSpanElement => el !== null,
    );
    if (letters.length === 0) return;

    const count = letters.length;
    const cx = new Float64Array(count);
    const cy = new Float64Array(count);
    const f = new Float64Array(count);
    const v = new Float64Array(count);
    const k = new Float64Array(count).fill(APPROACH_K);

    const beam = { x: 0, y: 0, r: 0 };
    const target = { x: 0, y: 0, r: 0 };
    let emPx = 16;
    let restR = 0;
    let hot = 0;
    let active = false;
    let raf = 0;

    const measure = () => {
      // Rects must be read with the letters at rest, or the centres drift.
      for (const el of letters) el.style.transform = "";

      const rect = stage.getBoundingClientRect();
      restR = Math.hypot(rect.width, rect.height) * 2;
      emPx = parseFloat(getComputedStyle(letters[0]).fontSize) || 16;

      for (let i = 0; i < count; i += 1) {
        const r = letters[i].getBoundingClientRect();
        cx[i] = r.left - rect.left + r.width / 2;
        cy[i] = r.top - rect.top + r.height / 2;
      }

      target.r = active ? hoverRadius() : restR;
      if (!active) beam.r = restR;
    };

    const clear = (el: HTMLSpanElement) => {
      el.style.transform = "";
      el.style.fontVariationSettings = "";
    };

    const writeBeam = () => {
      stage.style.setProperty("--beam-x", `${beam.x.toFixed(1)}px`);
      stage.style.setProperty("--beam-y", `${beam.y.toFixed(1)}px`);
      stage.style.setProperty("--beam-r", `${beam.r.toFixed(1)}px`);
    };

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      for (const el of letters) {
        el.style.willChange = "";
        clear(el);
      }
      const video = videoRef.current;
      if (video) video.playbackRate = RATE_REST;
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);

      beam.x += (target.x - beam.x) * POS_LERP;
      beam.y += (target.y - beam.y) * POS_LERP;
      beam.r += (target.r - beam.r) * RADIUS_LERP;
      writeBeam();

      hot += ((active ? 1 : 0) - hot) * HEAT_LERP;
      const video = videoRef.current;
      if (video) {
        const rate = RATE_REST + (RATE_LIT - RATE_REST) * hot;
        if (Math.abs(video.playbackRate - rate) > 0.01) video.playbackRate = rate;
      }

      const reach = beam.r * MAGNET_SCALE;
      const settled = hot < 0.01;
      let quiet = true;

      for (let i = 0; i < count; i += 1) {
        let tf = 0;
        if (active) {
          const dx = cx[i] - beam.x;
          const dy = cy[i] - beam.y;
          const n = clamp(1 - Math.hypot(dx, dy) / reach, 0, 1);
          tf = n * n * (3 - 2 * n);
        }

        v[i] = (v[i] + (tf - f[i]) * k[i]) * DAMPING;
        f[i] += v[i];

        const el = letters[i];
        const amount = f[i];

        // Hold the weight write through the release: `hot` is still fading,
        // and dropping it early would snap the letter back to its resting
        // weight mid-fade.
        if (
          !active &&
          settled &&
          Math.abs(amount) < QUIET &&
          Math.abs(v[i]) < QUIET
        ) {
          if (f[i] !== 0) {
            f[i] = 0;
            v[i] = 0;
            clear(el);
          }
          continue;
        }

        quiet = false;
        const offX = (cx[i] - beam.x) * PUSH * amount;
        const offY = -LIFT_EM * emPx * amount;
        const tilt = clamp((cx[i] - beam.x) / reach, -1, 1) * TILT_DEG * amount;

        el.style.transform =
          `translate3d(${offX.toFixed(2)}px, ${offY.toFixed(2)}px, 0)` +
          ` scale(${(1 + SCALE * amount).toFixed(4)})` +
          ` rotate(${tilt.toFixed(2)}deg)`;
        el.style.fontVariationSettings = `"wght" ${Math.round(
          WGHT_REST - WGHT_DIM * hot + WGHT_GAIN * clamp(amount, 0, 1),
        )}`;
      }

      if (!active && quiet && settled && Math.abs(beam.r - target.r) < 1) {
        stop();
      }
    };

    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const point = (e: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    // Touch is the only input that must be ignored: a tap would light the
    // mark with no way to unlight it.
    const hovers = (e: PointerEvent) =>
      e.pointerType === "mouse" || e.pointerType === "pen";

    const onEnter = (e: PointerEvent) => {
      if (!hovers(e)) return;
      const p = point(e);

      if (reduced) {
        // No trailing, no springs, no video ramp — the beam just sits under
        // the cursor as a plain hover state.
        beam.x = p.x;
        beam.y = p.y;
        beam.r = hoverRadius();
        writeBeam();
        stage.classList.add("is-lit");
        return;
      }

      if (!raf) {
        // Cold start: open at the cursor and close in, rather than
        // sweeping the beam across the mark. Mid-release, let it glide.
        beam.x = p.x;
        beam.y = p.y;
        beam.r = restR;
      }
      active = true;
      target.x = p.x;
      target.y = p.y;
      target.r = hoverRadius();
      k.fill(APPROACH_K);
      stage.classList.add("is-lit");
      for (const el of letters) el.style.willChange = "transform";
      start();
    };

    const onMove = (e: PointerEvent) => {
      if (!hovers(e)) return;
      // Doubles as the safety net if `pointerenter` never landed.
      if (reduced || !active) {
        onEnter(e);
        return;
      }
      const p = point(e);
      target.x = p.x;
      target.y = p.y;
    };

    const onLeave = () => {
      if (reduced) {
        stage.classList.remove("is-lit");
        beam.r = restR;
        writeBeam();
        return;
      }
      if (!active) return;
      active = false;
      target.r = restR;
      stage.classList.remove("is-lit");
      // Letters closest to where the pointer left snap back first, so the
      // release reads as a wave rather than a single collapse.
      for (let i = 0; i < count; i += 1) {
        const d = Math.hypot(cx[i] - beam.x, cy[i] - beam.y);
        const n = clamp(1 - d / (beam.r * 2), 0, 1);
        k[i] = RELEASE_K_FAR + (RELEASE_K_NEAR - RELEASE_K_FAR) * n;
      }
      start();
    };

    measure();

    let cancelled = false;
    void document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });

    const ro = new ResizeObserver(measure);
    ro.observe(stage);

    stage.addEventListener("pointerenter", onEnter);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    stage.addEventListener("pointercancel", onLeave);

    return () => {
      cancelled = true;
      ro.disconnect();
      stage.removeEventListener("pointerenter", onEnter);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      stage.removeEventListener("pointercancel", onLeave);
      stage.classList.remove("is-lit");
      stop();
    };
  }, [reduced]);

  return (
    <div
      ref={markRef}
      className={cn("footer__mark", revealed && "is-in")}
      aria-label={WORDMARK}
    >
      <div ref={stageRef} className="footer__mark-stage">
        <video
          ref={videoRef}
          className="footer__mark-video"
          src={WORDMARK_VIDEO}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          aria-hidden
        />

        <div className="footer__mark-beam" aria-hidden />

        <p className="footer__mark-type" aria-hidden>
          {WORDMARK.split("").map((char, i) => (
            <span
              key={`${char}-${i}`}
              className="footer__mark-letter"
              ref={(el) => {
                lettersRef.current[i] = el;
              }}
            >
              {char}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
