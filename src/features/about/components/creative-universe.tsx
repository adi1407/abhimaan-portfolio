"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { UNIVERSE } from "@/lib/about";
import { ROUTES } from "@/lib/constants";

/**
 * The dark act — the site's own navy pushed near-black so the tonal shift is
 * earned rather than foreign. Miniature work hangs at three depth planes;
 * pointer parallax and a slow scroll drift move each plane by a different
 * amount, so it reads as looking *into* a workspace rather than at cards.
 *
 * One rAF loop writes CSS variables (no per-element state), pauses when
 * off-screen, and is skipped entirely under reduced motion.
 */
export function CreativeUniverse() {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let raf = 0;
    let visible = true;
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    let drift = 0;

    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    io.observe(stage);

    const onScroll = () => {
      const r = stage.getBoundingClientRect();
      const span = r.height + window.innerHeight || 1;
      // -1 → 1 as the section travels through the viewport.
      drift = 1 - ((r.bottom / span) * 2 - 1);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      // Damped follow → inertia when the pointer stops.
      cur.x += (target.x - cur.x) * 0.055;
      cur.y += (target.y - cur.y) * 0.055;
      stage.style.setProperty("--px", cur.x.toFixed(4));
      stage.style.setProperty("--py", cur.y.toFixed(4));
      stage.style.setProperty("--drift", drift.toFixed(4));
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section className="uni" aria-labelledby="uni-title">
      <div ref={stageRef} className="uni__stage">
        <span className="uni__grid" aria-hidden />
        <span className="uni__glow" aria-hidden />

        <ul className="uni__pieces">
          {UNIVERSE.map((p) => (
            <li
              key={p.id}
              className={`uni__piece uni__piece--d${p.depth} uni__piece--${p.kind}`}
              style={{
                ["--x" as string]: `${p.x}%`,
                ["--y" as string]: `${p.y}%`,
                ["--r" as string]: `${p.rotate}deg`,
              }}
            >
              <span className="uni__thumb" aria-hidden />
              <span className="uni__label">{p.label}</span>
            </li>
          ))}
        </ul>

        <div className="uni__center">
          <p className="uni__eyebrow">
            <span className="uni__tick" aria-hidden />
            The workspace / 06
          </p>
          <h2 id="uni-title" className="uni__title">
            This is how
            <span className="uni__title-serif"> I see </span>
            the world.
          </h2>
          <p className="uni__lede">
            Seven kinds of object, one way of thinking — everything on a grid,
            everything arguing the same position.
          </p>

          <Link href={ROUTES.work} className="uni__cta">
            <span className="uni__cta-label">Selected work</span>
            <span className="uni__cta-arrow" aria-hidden>
              ↗
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
