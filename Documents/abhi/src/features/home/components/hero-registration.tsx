"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { HeroInkPlate } from "@/features/home/components/hero-ink-plate";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ROUTES, SITE } from "@/lib/constants";
import { type WorkCategoryId } from "@/lib/work";
import { useWorkCategories, useWorkItems } from "@/lib/cms/hooks";
import { cn } from "@/lib/cn";

/* ================================================================== *
 * CMYK registration hero
 *
 * ABHIMAAN is the fixed, registered truth. The discipline line beneath
 * it swaps by separating into four process plates that fly apart and
 * re-register, and on the same beat a real piece of work PRINTS beside
 * it — matched to the discipline being named, so the claim and the
 * proof land together.
 *
 * Nothing is asked of the visitor. Two motion systems, deliberately
 * kept apart so they never fight over `transform`:
 *   - the entrance/snap is pure CSS, on the plate itself
 *   - the ongoing loose-press drift is one rAF loop, on a child
 * ================================================================== */

/** Each discipline names a real category, so the still always backs
 *  up the word on screen rather than being decorative filler. */
const TERMS: {
  label: string;
  category: WorkCategoryId;
  pick: number;
}[] = [
  { label: "GRAPHIC DESIGNER", category: "posters", pick: 0 },
  { label: "BRAND IDENTITY", category: "logos", pick: 0 },
  { label: "ART DIRECTION", category: "posters", pick: 1 },
  { label: "VISUAL STORYTELLER", category: "books", pick: 0 },
  { label: "3D ARTIST", category: "thumbnails", pick: 0 },
  { label: "MOTION DESIGNER", category: "thumbnails", pick: 1 },
];

const HOLD_MS = 3200;
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

/** Solids then overprints — the strip a real sheet carries at the trim. */
const BAR = [
  { id: "c", label: "C" },
  { id: "m", label: "M" },
  { id: "y", label: "Y" },
  { id: "k", label: "K" },
  { id: "cm", label: "C+M" },
  { id: "cy", label: "C+Y" },
  { id: "my", label: "M+Y" },
  { id: "reg", label: "REG" },
];

export function HeroRegistration() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const plateRefs = useRef<(HTMLElement | null)[]>([]);
  const workItems = useWorkItems();
  const categories = useWorkCategories();

  const entry = TERMS[index];
  const term = entry.label;
  const loose = index === TERMS.length - 1;

  const items = workItems.filter((item) => item.category === entry.category);
  const item = items[entry.pick % Math.max(items.length, 1)];
  const categoryLabel =
    categories.find((c) => c.id === entry.category)?.short ?? entry.category;

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

      <div className="rh__inner">
        {/* --- Type column --- */}
        <div className="rh__col">
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
                <span key={t.label}>{t.label}</span>
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
          <span className="sr-only">
            {TERMS.map((t) => t.label).join(", ")}
          </span>

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

        {/* --- The work, printing on the same beat --- */}
        <div className="rh__stock">
          <HeroInkPlate
            src={item?.src ?? "/work/p-01.jpg"}
            alt={item ? `${item.title} — ${categoryLabel}` : "Selected work"}
            printKey={index}
            reduced={reduced}
          />
          <p className="rh__stock-cap">
            <span className="rh__stock-cat">{categoryLabel}</span>
            <span className="rh__stock-title">{item?.title ?? "Selected work"}</span>
            <span className="rh__stock-year">{item?.year ?? "2026"}</span>
          </p>
        </div>
      </div>

      {/* --- Colour bar: real press furniture, wired to the swap --- */}
      <div className="rh__bar" key={`bar-${index}`} aria-hidden>
        <span className="rh__bar-slug">
          {SITE.name} · 4/0 PROCESS · 350GSM UNCOATED
        </span>
        <span className="rh__bar-strip">
          {BAR.map((p, i) => (
            <span
              key={p.id}
              className={`rh__patch rh__patch--${p.id}`}
              style={{ ["--i" as string]: i }}
            >
              <em>{p.label}</em>
            </span>
          ))}
        </span>
        <span className="rh__bar-sheet">SHEET {index + 1} / {TERMS.length}</span>
      </div>
    </section>
  );
}
