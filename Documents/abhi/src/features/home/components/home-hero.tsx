"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RoleCycle } from "@/components/motion/role-cycle";
import { ScrambleText } from "@/components/motion/scramble-text";
import { HeroPosterField } from "@/features/home/components/hero-poster-field";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ROUTES, SITE } from "@/lib/constants";
import { cn } from "@/lib/cn";

const ROLES = [
  "Art Designer",
  "Graphic Designer",
  "Visual Designer",
] as const;

export function HomeHero() {
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), reduced ? 0 : 60);
    return () => window.clearTimeout(id);
  }, [reduced]);

  return (
    <section
      className={cn("hero", ready && "is-ready")}
      aria-labelledby="hero-brand"
    >
      <HeroPosterField ready={ready} />

      <div className="hero__center">
        <p className="hero__eyebrow">
          <span className="hero__pulse" aria-hidden />
          <ScrambleText>PORTFOLIO — 2026</ScrambleText>
        </p>

        <h1 id="hero-brand" className="hero__brand">
          {SITE.name.toUpperCase()}
        </h1>

        <p className="hero__role-row">
          <span className="hero__role-prefix" aria-hidden>
            a
          </span>
          <span className="sr-only">a {ROLES.join(", ")}</span>
          <RoleCycle roles={ROLES} className="hero__role" holdMs={2200} />
        </p>

        <p className="hero__lead">
          Identities, stories &amp; visual systems — composed, never templated.
        </p>

        <div className="hero__cta">
          <Link href={ROUTES.work} className="hero__cta-primary">
            View work
            <span aria-hidden>→</span>
          </Link>
          <Link href={ROUTES.contact} className="hero__cta-secondary">
            Start a brief
          </Link>
        </div>
      </div>
    </section>
  );
}
