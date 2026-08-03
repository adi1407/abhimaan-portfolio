"use client";

import { useEffect, useRef } from "react";
import { DNA } from "@/lib/about";

/**
 * Creative DNA — principles, not percentages. Each row unrolls its rule as a
 * measured typographic transform (index counts up, title shears into place,
 * hairline draws across) so the four ideas read as a system.
 */
export function CreativeDna() {
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const els = rowRefs.current.filter(Boolean) as HTMLLIElement[];
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -18% 0px", threshold: 0.25 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section className="dna" aria-labelledby="dna-title">
      <div className="dna__head">
        <p className="dna__eyebrow">
          <span className="dna__tick" aria-hidden />
          Constants / 05
        </p>
        <h2 id="dna-title" className="dna__title">
          Creative DNA
        </h2>
      </div>

      <ol className="dna__list">
        {DNA.map((p, i) => (
          <li
            key={p.id}
            ref={(el) => {
              rowRefs.current[i] = el;
            }}
            className="dna__row"
            style={{ ["--i" as string]: i }}
          >
            <span className="dna__id" aria-hidden>
              {p.id}
            </span>
            <h3 className="dna__name">{p.title}</h3>
            <p className="dna__line">{p.line}</p>
            <span className="dna__rule" aria-hidden />
          </li>
        ))}
      </ol>
    </section>
  );
}
