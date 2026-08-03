"use client";

import { useEffect, useRef } from "react";
import { CREATE_WORDS } from "@/lib/about";

/**
 * "I create …" — each word enters with a transition that argues its own
 * meaning (brands assemble from parts, posters slide like sheets, socials
 * stack, thumbnails shuffle then lock, identities align to a grid,
 * experiences expand toward you).
 *
 * One IntersectionObserver flips a class per line; the motion itself is CSS,
 * so there is no per-frame JS and reduced-motion can neutralise it wholesale.
 */
export function KineticCreate() {
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
      { rootMargin: "0px 0px -24% 0px", threshold: 0.3 },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section className="kc" aria-labelledby="kc-title">
      <p className="kc__eyebrow">
        <span className="kc__tick" aria-hidden />
        What I make / 02
      </p>

      <h2 id="kc-title" className="kc__lead">
        I create
      </h2>

      <ul className="kc__list">
        {CREATE_WORDS.map((item, i) => (
          <li
            key={item.word}
            ref={(el) => {
              rowRefs.current[i] = el;
            }}
            className={`kc__row kc__row--${item.motion}`}
            style={{ ["--i" as string]: i }}
          >
            <span className="kc__index" aria-hidden>
              {String(i + 1).padStart(2, "0")}
            </span>

            <span className="kc__word">
              {/* Per-letter cells give the assemble / shuffle / grid motions
                  something to act on; the plain word stays in the a11y tree. */}
              <span className="sr-only">{item.word}</span>
              <span className="kc__letters" aria-hidden>
                {item.word.split("").map((ch, j) => (
                  <span
                    key={`${ch}-${j}`}
                    className="kc__ch"
                    style={{ ["--j" as string]: j }}
                  >
                    {ch}
                  </span>
                ))}
              </span>
            </span>

            <span className="kc__note" aria-hidden>
              {item.note}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
