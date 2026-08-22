"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { HeroWordmark } from "@/features/home/components/hero-wordmark";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ROUTES, SITE } from "@/lib/constants";
import { useHome, useWorkItems } from "@/lib/cms/hooks";
import { cn } from "@/lib/cn";

/* ================================================================== *
 * Cinema hero
 *
 * A tilted wall of work scrolls behind the name. The wordmark uses a
 * magnetic spotlight hover. A paper plane glides over the page on its
 * own — no ID card hitch.
 * ================================================================== */

const TERMS = [
  "Graphic Designer",
  "Brand Identity",
  "Art Direction",
  "Visual Storyteller",
  "Motion Designer",
] as const;

const TERM_MS = 2600;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

/**
 * Every column carries the whole set, each starting at a different
 * point in it. That way no column repeats a still within itself, and
 * neighbouring columns never show the same frame side by side.
 */
function buildColumns(items: { src: string }[]) {
  const srcs: string[] = [];
  for (const item of items) {
    if (item.src && !srcs.includes(item.src)) srcs.push(item.src);
  }
  const pool = srcs.length ? srcs : ["/work/p-01.jpg"];
  const rotate = (offset: number) =>
    pool.map((_, i) => pool[(i + offset) % pool.length]);
  const step = Math.max(1, Math.floor(pool.length / 3));
  return [rotate(0), rotate(step), rotate(step * 2)];
}

export function HeroCinema() {
  const workItems = useWorkItems();
  const home = useHome<{
    hero?: {
      eyebrow?: string;
      roles?: string[];
      lede?: string;
      ctaWork?: string;
      ctaContact?: string;
    };
  }>();
  const terms = home.hero?.roles?.length ? home.hero.roles : TERMS;
  const reduced = useReducedMotion();
  const [term, setTerm] = useState(0);
  const [lit, setLit] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const wallRef = useRef<HTMLDivElement>(null);
  const columns = useMemo(() => buildColumns(workItems), [workItems]);

  /* Kick the entrance on the frame after mount so the mask animation
     always has a clean starting state to run from. */
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setLit(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(
      () => setTerm((n) => (n + 1) % Math.max(terms.length, 1)),
      TERM_MS,
    );
    return () => window.clearInterval(id);
  }, [terms.length]);

  /* Exit glow — intensifies as the hero scrolls out. */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const h = Math.max(rect.height, 1);
      /* 0 while hero fills the view; rises as the bottom leaves the fold. */
      const raw = clamp((-rect.top) / (h * 0.72), 0, 1);
      const eased = raw * raw * (3 - 2 * raw);
      section.style.setProperty("--exit", eased.toFixed(4));
      section.style.setProperty(
        "--exit-glow",
        (0.35 + eased * 0.95).toFixed(3),
      );
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  /* Slow parallax lean — ambient, so reduced motion opts out. */
  useEffect(() => {
    if (reduced) return;
    const wall = wallRef.current;
    if (!wall) return;

    let raf = 0;
    let last = performance.now();
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
      const k = 1 - Math.exp(-dt * 2.2);
      cur.x += (target.x - cur.x) * k;
      cur.y += (target.y - cur.y) * k;
      wall.style.setProperty("--px", `${(cur.x * 26).toFixed(2)}px`);
      wall.style.setProperty("--py", `${(cur.y * 18).toFixed(2)}px`);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [reduced]);

  return (
    <section
      ref={sectionRef}
      className={cn("ch", lit && "is-lit")}
      aria-labelledby="ch-name"
      style={{ ["--exit" as string]: 0 }}
    >
      {/* Tilted wall of work */}
      <div ref={wallRef} className="ch__wall" aria-hidden>
        {columns.map((col, ci) => (
          <div key={ci} className={`ch__col ch__col--${ci}`}>
            {/* Doubled so the loop is seamless at -50%. */}
            <div className="ch__track">
              {[...col, ...col].map((src, i) => (
                <span key={`${ci}-${i}`} className="ch__frame">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    draggable={false}
                    loading={ci === 0 && i < 2 ? "eager" : "lazy"}
                    decoding="async"
                  />
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <span className="ch__scrim" aria-hidden />
      <span className="ch__bloom" aria-hidden />
      <span className="ch__exit-glow" aria-hidden />
      <span className="ch__exit-beam" aria-hidden />
      <span className="ch__grain" aria-hidden />

      <div className="ch__inner">
        <p className="ch__eyebrow">
          <span className="ch__dot" aria-hidden />
          {home.hero?.eyebrow || "Portfolio — 2026"}
          <span className="ch__rule" aria-hidden />
        </p>

        <div className="ch__name">
          <h1 id="ch-name" className="sr-only">
            {SITE.name}
          </h1>
          <HeroWordmark ready={lit} />
        </div>

        <p className="ch__role" aria-hidden>
          <span className="ch__role-sizer">
            {terms.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </span>
          <span key={term} className="ch__role-live">
            {terms[term] ?? terms[0]}
          </span>
        </p>
        <span className="sr-only">{terms.join(", ")}</span>

        <p className="ch__lead">
          {home.hero?.lede ||
            "Identity, editorial & visual systems — composed, never templated."}
        </p>

        <div className="ch__cta">
          <Link href={ROUTES.work} className="ch__btn ch__btn--solid">
            <span>{home.hero?.ctaWork || "Enter the work"}</span>
            <em aria-hidden>→</em>
          </Link>
          <Link href={ROUTES.contact} className="ch__btn ch__btn--ghost">
            <span>{home.hero?.ctaContact || "Start a brief"}</span>
          </Link>
        </div>
      </div>

      <span className="ch__cue" aria-hidden>
        <em />
        Scroll
      </span>
    </section>
  );
}
