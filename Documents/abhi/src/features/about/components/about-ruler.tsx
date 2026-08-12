"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { ACTS } from "@/lib/about";
import { useAbout } from "@/lib/cms/hooks";

const TICKS = 44;

/**
 * Scroll indicator built as a designer's ruler — measurement ticks, a travelling
 * indicator and the current act — rather than a progress bar. Acts are tracked
 * by a centre-line scroll-spy over the sections themselves.
 */
export function AboutRuler() {
  const about = useAbout<{ acts?: typeof ACTS }>();
  const acts = about.acts?.length ? about.acts : ACTS;
  const [active, setActive] = useState(0);
  const fillRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const sections = acts.map((a) => document.getElementById(`act-${a.id}`))
      .filter(Boolean) as HTMLElement[];

    const spy = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = sections.indexOf(e.target as HTMLElement);
          if (i >= 0) setActive(i);
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );
    sections.forEach((s) => spy.observe(s));

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max =
          document.documentElement.scrollHeight - window.innerHeight || 1;
        const p = Math.min(1, Math.max(0, window.scrollY / max));
        fillRef.current?.style.setProperty("transform", `scaleY(${p})`);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      spy.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [acts]);

  return (
    <aside className="rule" aria-label="Section progress">
      <p className="rule__head">
        <span className="rule__head-label">About</span>
        <span className="rule__head-count">
          {String(active + 1).padStart(2, "0")}
          <em>/ {String(acts.length).padStart(2, "0")}</em>
        </span>
      </p>

      <div className="rule__track" aria-hidden>
        <span ref={fillRef} className="rule__fill" />
        {Array.from({ length: TICKS }).map((_, i) => (
          <span
            key={i}
            className={cn("rule__tick", i % 5 === 0 && "is-major")}
          />
        ))}
      </div>

      <ol className="rule__acts">
        {acts.map((act, i) => (
          <li
            key={act.id}
            className={cn("rule__act", i === active && "is-on")}
          >
            <a href={`#act-${act.id}`}>
              <span className="rule__act-no">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="rule__act-label">{act.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </aside>
  );
}
