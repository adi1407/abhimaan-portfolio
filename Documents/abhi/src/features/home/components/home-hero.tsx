"use client";

import { Reveal } from "@/components/motion/reveal";
import { ScrambleText } from "@/components/motion/scramble-text";
import { RoleCycle } from "@/components/motion/role-cycle";
import { HeroCargo } from "@/features/home/components/hero-cargo";
import { HeroSignature } from "@/features/home/components/hero-signature";
import { HeroStage } from "@/features/home/components/hero-stage";

const ROLES = [
  "Art Designer",
  "Graphic Designer",
  "Visual Designer",
] as const;

const META = ["Identity", "Editorial", "Art Direction"] as const;

const LEAD_WORDS = [
  "Creating",
  "identities,",
  "stories",
  "&",
  "visual",
  "systems",
  "—",
] as const;

export function HomeHero() {
  return (
    <section className="hero">
      <HeroStage />
      <span className="hero__orb" aria-hidden />

      <div className="hero__inner">
        <div className="hero__copy">
          <Reveal immediate delay={0} from="up" className="hero__eyebrow-wrap">
            <p className="hero__eyebrow">
              <span className="hero__pulse" aria-hidden />
              <ScrambleText>PORTFOLIO — 2026</ScrambleText>
            </p>
          </Reveal>

          <Reveal immediate delay={300} from="up" className="hero__hello">
            <p>
              Hello I am
              <span className="hero__hello-line" aria-hidden />
            </p>
          </Reveal>

          <h1 className="hero__title">
            <span className="hero__word-wrap">
              <HeroSignature className="hero__word" />
            </span>
            <Reveal immediate delay={1750} from="up" className="hero__role-row">
              <span className="hero__title-prefix" aria-hidden>
                a
              </span>
              <span className="sr-only">a {ROLES.join(", ")}</span>
              <RoleCycle roles={ROLES} className="hero__role" />
            </Reveal>
          </h1>

          <Reveal immediate delay={2000} from="up" className="hero__lead">
            <p className="hero__lead-split" aria-label="Creating identities, stories & visual systems">
              {LEAD_WORDS.map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  className="hero__lead-word"
                  style={{ ["--i" as string]: i }}
                  aria-hidden
                >
                  {word}
                  {i < LEAD_WORDS.length - 1 ? "\u00A0" : ""}
                </span>
              ))}
            </p>
            <span className="hero__lead-serif"> composed, never templated.</span>
          </Reveal>

          <Reveal immediate delay={2200} from="up" className="hero__meta">
            {META.map((label, i) => (
              <span key={label} style={{ ["--i" as string]: i }}>
                {label}
              </span>
            ))}
          </Reveal>
        </div>
      </div>

      {/*
        Desktop: absolute over the reserved right column.
        Mobile: in-flow slot under the copy (see .hero__badge-slot).
      */}
      <div className="hero__badge-slot">
        <HeroCargo />
      </div>

      <div className="hero__scroll" aria-hidden>
        <span>Scroll</span>
        <span className="hero__scroll-line" />
      </div>
    </section>
  );
}
