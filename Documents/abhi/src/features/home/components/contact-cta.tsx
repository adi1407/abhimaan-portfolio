"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/layout/container";
import { BorderGlow } from "@/components/motion/border-glow";
import { BORDER_GLOW_DARK } from "@/components/motion/border-glow-presets";
import { NeonGlowButton } from "@/components/motion/neon-glow-button";
import { NEON_GLOW_PORTFOLIO } from "@/components/motion/neon-glow-presets";
import { RoleCycle } from "@/components/motion/role-cycle";
import { ROUTES, SITE } from "@/lib/constants";
import { useHome, useSettings } from "@/lib/cms/hooks";

const VERBS = ["make", "create", "craft", "build"] as const;

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "Behance", href: "https://www.behance.net/abhishahi2" },
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "Dribbble", href: "https://dribbble.com" },
];

export function ContactCta() {
  const home = useHome<{
    cta?: { verbs?: string[]; line?: string; note?: string };
  }>();
  const settings = useSettings<{
    name?: string;
    socials?: { label: string; href: string }[];
  }>();
  const verbs = home.cta?.verbs?.length ? home.cta.verbs : [...VERBS];
  const socials = settings.socials?.length ? settings.socials : SOCIALS;
  const line = home.cta?.line || "something worth looking at";
  const note =
    home.cta?.note || "Currently taking on selected projects";
  const [time, setTime] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const tick = () => {
      setTime(
        new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Kolkata",
          hour12: false,
        }).format(new Date()),
      );
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="contact" aria-labelledby="contact-heading">
      <Container>
        <BorderGlow
          className="contact__panel"
          variant="portfolio-dark"
          animated={!reducedMotion}
          {...BORDER_GLOW_DARK}
        >
        <div className="contact__head">
          <p className="contact__eyebrow">03 — Contact</p>
          <p className="contact__clock">
            <span className="contact__pulse" aria-hidden />
            {time} IST
          </p>
        </div>

        <h2 id="contact-heading" className="contact__title">
          <span className="contact__title-row">
            <span className="contact__title-static">Let&rsquo;s</span>{" "}
            <span className="sr-only">{verbs.join(", ")}</span>
            <RoleCycle roles={verbs} className="contact__verb" holdMs={2200} />
          </span>
          <span className="contact__title-static contact__title-static--break">
            {line}
          </span>
        </h2>

        <div className="contact__actions">
          <NeonGlowButton
            className="contact__neon"
            label="Get in touch"
            link={ROUTES.contact}
            {...NEON_GLOW_PORTFOLIO}
            colors={{
              fill: "transparent",
              hoverFill: "rgba(37, 99, 255, 0.18)",
              textColor: "#ffffff",
              hoverTextColor: "#93c5fd",
            }}
            border={{
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "rgba(255,255,255,0.35)",
              borderTopWidth: 1,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderBottomWidth: 1,
            }}
            glow={{ blur: 6, size: 7, color: "#60a5fa" }}
          />
          <span className="contact__sep" aria-hidden />
          <ul className="contact__socials">
            {socials.map((social) => (
              <li key={social.label}>
                <a href={social.href} target="_blank" rel="noreferrer noopener">
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <p className="contact__note">
          {note} for {new Date().getFullYear()} — identity, digital and art
          direction. {settings.name || SITE.name} replies within two working
          days.
        </p>
        </BorderGlow>
      </Container>
    </section>
  );
}
