"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ScrambleText } from "@/components/motion/scramble-text";
import { PosterWall } from "@/features/home/components/poster-wall";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ROUTES, SITE } from "@/lib/constants";
import { cn } from "@/lib/cn";

const BRAND = "ABHIMAAN";

/**
 * Intro phases (ms from mount):
 *  tiles → brand → copy → idle (parallax / sheen armed)
 */
const T_BRAND = 520;
const T_COPY = 980;
const T_IDLE = 1280;

export function HomeHero() {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<"hold" | "brand" | "copy" | "idle">(
    "hold",
  );
  const ctaRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (reduced) {
      const id = window.setTimeout(() => setPhase("idle"), 0);
      return () => window.clearTimeout(id);
    }

    const a = window.setTimeout(() => setPhase("brand"), T_BRAND);
    const b = window.setTimeout(() => setPhase("copy"), T_COPY);
    const c = window.setTimeout(() => setPhase("idle"), T_IDLE);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
      window.clearTimeout(c);
    };
  }, [reduced]);

  const onCtaMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = ctaRef.current;
    if (!el || reduced) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    el.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
  };

  const onCtaLeave = () => {
    if (ctaRef.current) ctaRef.current.style.transform = "";
  };

  const showBrand = phase !== "hold" || reduced;
  const showCopy = phase === "copy" || phase === "idle" || reduced;
  const idle = phase === "idle" || reduced;

  return (
    <section
      className={cn(
        "hero",
        showBrand && "is-brand",
        showCopy && "is-copy",
        idle && "is-idle",
      )}
      aria-labelledby="hero-brand"
    >
      <PosterWall idle={idle} />

      <div className="hero__inner">
        <p
          className={cn("hero__eyebrow", showCopy && "is-in")}
        >
          <span className="hero__pulse" aria-hidden />
          <ScrambleText>PORTFOLIO — 2026</ScrambleText>
        </p>

        <h1 id="hero-brand" className="hero__brand">
          <span className="sr-only">{SITE.name}</span>
          <span
            className={cn("hero__brand-line", showBrand && "is-in")}
            aria-hidden
          >
            {BRAND.split("").map((char, i) => (
              <span
                key={`${char}-${i}`}
                className="hero__brand-char"
                style={{ ["--i" as string]: i }}
              >
                {char}
              </span>
            ))}
            <span className="hero__brand-sheen" />
          </span>
        </h1>

        <div className={cn("hero__lead", showCopy && "is-in")}>
          <p>
            Art direction, identity &amp; visual systems — composed, never
            templated.
          </p>
        </div>

        <div className={cn("hero__cta", showCopy && "is-in")}>
          <Link
            ref={ctaRef}
            href={ROUTES.work}
            className="hero__cta-primary"
            onMouseMove={onCtaMove}
            onMouseLeave={onCtaLeave}
          >
            <span className="hero__cta-chip" aria-hidden />
            <span className="hero__cta-label">
              View work
              <span aria-hidden>→</span>
            </span>
          </Link>
          <Link href={ROUTES.contact} className="hero__cta-secondary">
            Start a brief
          </Link>
        </div>
      </div>

      <div className={cn("hero__scroll", showCopy && "is-in")} aria-hidden>
        <span className="hero__scroll-rail">
          <span className="hero__scroll-thumb" />
        </span>
        <span>Scroll</span>
      </div>
    </section>
  );
}
