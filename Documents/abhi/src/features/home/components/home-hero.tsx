"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ROUTES, SITE } from "@/lib/constants";
import { cn } from "@/lib/cn";

/* ================================================================== *
 * Home hero — CMYK registration
 *
 * ABHIMAAN is the fixed, registered truth. The discipline line beneath
 * it swaps by separating into four process plates that fly apart and
 * re-register: the incoming word arrives misaligned and colour-fringed,
 * then snaps into one crisp mark with a press-shudder.
 *
 * Nothing is asked of the visitor. Two motion systems, deliberately
 * kept apart so they never fight over `transform`:
 *   - the entrance/snap is pure CSS, on the plate itself
 *   - the ongoing loose-press drift is one rAF loop, on a child
 * ================================================================== */

const TERMS = [
  "GRAPHIC DESIGNER",
  "BRAND IDENTITY",
  "ART DIRECTION",
  "VISUAL STORYTELLER",
  "3D ARTIST",
  "MOTION DESIGNER",
] as const;

const HOLD_MS = 2500;
/** The last term hangs out of register a beat longer before locking. */
const LOOSE_EXTRA_MS = 420;

/** Plate order is print order: C, M, Y, then the key plate last. */
const PLATES = [
  { id: "c", drift: { ax: 1.5, ay: 1.1, sx: 0.42, sy: 0.31, ph: 0.0, lag: 3.4 } },
  { id: "m", drift: { ax: 1.3, ay: 1.4, sx: 0.35, sy: 0.44, ph: 1.9, lag: 2.6 } },
  { id: "y", drift: { ax: 1.7, ay: 0.9, sx: 0.28, sy: 0.38, ph: 3.4, lag: 1.8 } },
  // The key plate barely moves — it's what everything else registers to.
  { id: "k", drift: { ax: 0.4, ay: 0.3, sx: 0.33, sy: 0.29, ph: 4.7, lag: 0.5 } },
] as const;

export function HomeHero() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const plateRefs = useRef<(HTMLElement | null)[]>([]);

  const term = TERMS[index];
  const loose = index === TERMS.length - 1;

  /* --- Advance the line ----------------------------------------- */
  useEffect(() => {
    const id = window.setTimeout(
      () => setIndex((n) => (n + 1) % TERMS.length),
      HOLD_MS + (loose ? LOOSE_EXTRA_MS : 0),
    );
    return () => window.clearTimeout(id);
  }, [index, loose]);

  /* --- Loose press: slow misregistration + pointer lag ------------ */
  useEffect(() => {
    if (reduced) return;

    let raf = 0;
    let last = performance.now();
    const start = last;
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };

    const onMove = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = (now - start) / 1000;

      const k = 1 - Math.exp(-dt * 2.6);
      cur.x += (target.x - cur.x) * k;
      cur.y += (target.y - cur.y) * k;

      for (let i = 0; i < PLATES.length; i += 1) {
        const el = plateRefs.current[i];
        if (!el) continue;
        const d = PLATES[i].drift;
        const x = Math.sin(t * d.sx + d.ph) * d.ax + cur.x * d.lag;
        const y = Math.cos(t * d.sy + d.ph) * d.ay + cur.y * d.lag * 0.6;
        el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [reduced]);

  return (
    <section className="rh" aria-labelledby="rh-brand">
      {/* Print-sheet furniture */}
      <span className="rh__grain" aria-hidden />
      {["tl", "tr", "bl", "br"].map((c) => (
        <span key={c} className={`rh__mark rh__mark--${c}`} aria-hidden>
          <svg viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="9.5" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M20 0v14M20 26v14M0 20h14M26 20h14" stroke="currentColor" strokeWidth="1" />
          </svg>
        </span>
      ))}
      <span className="rh__slug" aria-hidden>
        {SITE.name} — 4/0 process · 2026
      </span>

      <div className="rh__inner">
        <p className="rh__eyebrow" aria-hidden>
          <span className="rh__dot" />
          Portfolio — 2026
        </p>

        <h1 id="rh-brand" className="rh__brand">
          {SITE.name.toUpperCase()}
        </h1>

        {/* The registering line */}
        <p className="rh__reg" aria-hidden>
          {/* Reserves the widest term so the line never reflows mid-swap. */}
          <span className="rh__sizer">
            {TERMS.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </span>

          <span
            key={index}
            className={cn("rh__live", loose && "is-loose", reduced && "is-flat")}
          >
            {PLATES.map((p, i) => (
              <span key={p.id} className={`rh__plate rh__plate--${p.id}`}>
                <i
                  ref={(el) => {
                    plateRefs.current[i] = el;
                  }}
                >
                  {term}
                </i>
              </span>
            ))}
          </span>
        </p>
        <span className="sr-only">{TERMS.join(", ")}</span>

        <p className="rh__lead">
          Identity, editorial &amp; visual systems — composed, never templated.
        </p>

        <div className="rh__cta">
          <Link href={ROUTES.work} className="rh__cta-primary">
            Enter the work
            <span aria-hidden>→</span>
          </Link>
          <Link href={ROUTES.contact} className="rh__cta-secondary">
            Start a brief
          </Link>
        </div>
      </div>
    </section>
  );
}
