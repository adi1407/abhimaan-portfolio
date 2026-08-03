"use client";

import { Reveal } from "@/components/motion/reveal";

/**
 * Manifesto — typography carries the argument, no cards. IDEA, EMOTION and
 * CLARITY each get a distinct but coordinated treatment (outlined display /
 * editorial serif / geometric sans) so the setting demonstrates the point.
 */
export function AboutManifesto() {
  return (
    <section className="mf" aria-labelledby="mf-title">
      <Reveal from="up">
        <p className="mf__eyebrow">
          <span className="mf__tick" aria-hidden />
          My approach / 03
        </p>
      </Reveal>

      <Reveal from="up" delay={80}>
        <h2 id="mf-title" className="mf__title">
          Design isn&rsquo;t decoration.
        </h2>
      </Reveal>

      <Reveal from="up" delay={160}>
        <p className="mf__intersection">It&rsquo;s the intersection of</p>
      </Reveal>

      <div className="mf__trio">
        <Reveal from="up" delay={220}>
          <span className="mf__word mf__word--idea">Idea,</span>
        </Reveal>
        <Reveal from="up" delay={320}>
          <span className="mf__word mf__word--emotion">emotion,</span>
        </Reveal>
        <Reveal from="up" delay={420}>
          <span className="mf__word mf__word--clarity">clarity.</span>
        </Reveal>
      </div>

      <Reveal from="up" delay={520}>
        <p className="mf__close">
          I transform concepts into visual systems people can recognise,
          remember and feel.
        </p>
      </Reveal>

      <span className="mf__rule" aria-hidden />
    </section>
  );
}
