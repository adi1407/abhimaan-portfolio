"use client";

import { IdCard } from "@/features/home/components/id-card";
import { Reveal } from "@/components/motion/reveal";

/**
 * Badge act — reuses the studio credential from the hero (it already models
 * the drop, overshoot, damped pendulum, drag-with-tension and front/back
 * flip), re-anchored to hang centre-stage. The philosophy on the right is the
 * badge's reverse, promoted to real HTML so it is readable without flipping.
 */
export function AboutBadge() {
  return (
    <section className="ab-badge" aria-labelledby="ab-badge-title">
      <div className="ab-badge__stage">
        <IdCard anchorRatio={0.5} />
      </div>

      <div className="ab-badge__copy">
        <Reveal from="up">
          <p className="ab-badge__eyebrow">
            <span className="ab-badge__tick" aria-hidden />
            The credential
          </p>
        </Reveal>

        <Reveal from="up" delay={90}>
          <h2 id="ab-badge-title" className="ab-badge__title">
            I turn ideas
            <span className="ab-badge__title-serif"> into visual </span>
            stories.
          </h2>
        </Reveal>

        <Reveal from="up" delay={180}>
          <p className="ab-badge__lede">
            Drag the badge. Tap it to read the other side — the same thing this
            practice is built on.
          </p>
        </Reveal>

        <Reveal from="up" delay={260}>
          <blockquote className="ab-badge__quote">
            <p>
              I don&rsquo;t decorate ideas.
              <span> I give them an identity.</span>
            </p>
            <footer>
              Concepts become visual systems people recognise, remember and
              feel — a mark, a grid, a voice that still holds three years on.
            </footer>
          </blockquote>
        </Reveal>
      </div>
    </section>
  );
}
