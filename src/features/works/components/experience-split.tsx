"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { WORK_EXPERIENCES } from "@/lib/works";

/**
 * Split case-study: a sticky left panel whose giant year + role morph as you
 * scroll, alongside a right column of detail blocks. The active block is
 * tracked with a thin viewport-centre band (scroll-spy), and each block
 * reveals once on entry. No scroll-jacking, so it survives App Router
 * navigation and reduced-motion cleanly.
 */
export function ExperienceSplit() {
  const count = WORK_EXPERIENCES.length;
  const [active, setActive] = useState(0);
  const blockRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const els = blockRefs.current.filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;

    // Reveal each block once as it enters from below.
    const revealIO = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            revealIO.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -18% 0px", threshold: 0.15 },
    );

    // Active = the block crossing the vertical centre of the viewport.
    const spyIO = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-index"));
            if (!Number.isNaN(idx)) setActive(idx);
          }
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );

    els.forEach((el) => {
      revealIO.observe(el);
      spyIO.observe(el);
    });

    return () => {
      revealIO.disconnect();
      spyIO.disconnect();
    };
  }, []);

  const cur = WORK_EXPERIENCES[active];

  return (
    <section className="exp" aria-label="Work experience timeline">
      <div className="exp__grid">
        {/* Sticky left — morphing year + role */}
        <aside className="exp__aside" aria-hidden>
          <p className="exp__aside-label">Timeline</p>

          <div className="exp__year-stage">
            <span key={cur.year} className="exp__year">
              {cur.year}
            </span>
          </div>

          <div className="exp__aside-meta">
            <span key={`role-${active}`} className="exp__aside-role">
              {cur.role}
            </span>
            <span key={`co-${active}`} className="exp__aside-co">
              {cur.company} · {cur.location}
            </span>
          </div>

          <div className="exp__progress">
            <span className="exp__progress-count">
              {String(active + 1).padStart(2, "0")}
              <em>/ {String(count).padStart(2, "0")}</em>
            </span>
            <span className="exp__progress-track">
              <span
                className="exp__progress-fill"
                style={{ transform: `scaleY(${(active + 1) / count})` }}
              />
            </span>
          </div>
        </aside>

        {/* Right — scrolling detail blocks */}
        <ol className="exp__list">
          {WORK_EXPERIENCES.map((xp, i) => (
            <li
              key={xp.id}
              data-index={i}
              ref={(el) => {
                blockRefs.current[i] = el;
              }}
              className={cn("exp__block", active === i && "is-active")}
            >
              <span className="exp__ghost" aria-hidden>
                {xp.year}
              </span>

              <div className="exp__block-inner">
                <div className="exp__block-head">
                  <span className="exp__block-num">{xp.id}</span>
                  <span className="exp__block-dates">{xp.dates}</span>
                </div>

                <p className="exp__block-co">{xp.company}</p>
                <h2 className="exp__block-role">{xp.role}</h2>
                <p className="exp__block-summary">{xp.summary}</p>

                <ul className="exp__block-points">
                  {xp.highlights.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>

                <ul className="exp__block-tags">
                  {xp.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
