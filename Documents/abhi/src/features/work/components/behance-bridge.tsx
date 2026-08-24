"use client";

import { Container } from "@/components/layout/container";
import { BorderGlow } from "@/components/motion/border-glow";
import { BORDER_GLOW_DARK } from "@/components/motion/border-glow-presets";
import { FlowingMenu } from "@/components/motion/flowing-menu";
import {
  CATEGORY_FLOW_IMAGES,
  FLOWING_MENU_DARK,
} from "@/components/motion/flowing-menu-presets";
import { NeonGlowButton } from "@/components/motion/neon-glow-button";
import { NEON_GLOW_PORTFOLIO } from "@/components/motion/neon-glow-presets";
import { useWorkCategories } from "@/lib/cms/hooks";
import { useCms } from "@/lib/cms/provider";
import { useEffect, useState } from "react";

export function BehanceBridge() {
  const cms = useCms();
  const categories = useWorkCategories();
  const behance = cms.work.behance;
  const profile = behance.profileUrl || null;
  const linked = Boolean(profile || behance.username);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <section className="bb" aria-label="Behance bridge">
      <Container>
        <BorderGlow
          className="bb__desk"
          variant="portfolio-dark"
          animated={!reducedMotion}
          {...BORDER_GLOW_DARK}
        >
          <div className="bb__desk-inner">
            <span className="bb__ghost" aria-hidden>
              Bé
            </span>

            <div className="bb__main">
              <p className="bb__eyebrow">Bridge</p>
              <h2 className="bb__title">{behance.displayName || "Behance"}</h2>
              <p className="bb__copy">
                Projects are curated on this site. Behance is the public case-study
                home for {behance.displayName || "this studio"} — linked here, not
                auto-fetched.
              </p>

              <div className="bb__status">
                <span
                  className={
                    linked ? "bb__chip bb__chip--on" : "bb__chip bb__chip--off"
                  }
                >
                  {linked ? "Linked · curated" : "Not linked yet"}
                </span>
                {behance.username ? (
                  <span className="bb__handle">@{behance.username}</span>
                ) : null}
              </div>

              <div className="bb__actions">
                {profile ? (
                  <NeonGlowButton
                    className="bb__neon"
                    label="Open on Behance"
                    link={profile}
                    newTab
                    {...NEON_GLOW_PORTFOLIO}
                    colors={{
                      fill: "#ffffff",
                      hoverFill: "#f7f4ec",
                      textColor: "#0b1f4d",
                      hoverTextColor: "#2563ff",
                    }}
                    border={{
                      borderWidth: 1,
                      borderStyle: "solid",
                      borderColor: "#2563ff",
                      borderTopWidth: 1,
                      borderLeftWidth: 1,
                      borderRightWidth: 1,
                      borderBottomWidth: 1,
                    }}
                    glow={{ blur: 5, size: 6, color: "#2563ff" }}
                    icon={{
                      side: "right",
                      size: 14,
                      type: "symbol",
                      symbol: "↗",
                      color: "#0b1f4d",
                      hoverColor: "#2563ff",
                    }}
                  />
                ) : (
                  <p className="bb__hint">Add a Behance URL in Admin → Work.</p>
                )}
              </div>
            </div>

            <div className="bb__cuts">
              <FlowingMenu
                className="bb__cuts-flow"
                variant="compact"
                items={categories.map((cat) => {
                  const url = behance.collections[cat.id];
                  return {
                    text: cat.short,
                    image:
                      CATEGORY_FLOW_IMAGES[cat.id] ??
                      CATEGORY_FLOW_IMAGES.posters,
                    link: url || undefined,
                    external: Boolean(url),
                  };
                })}
                {...FLOWING_MENU_DARK}
              />
            </div>
          </div>
        </BorderGlow>
      </Container>
    </section>
  );
}
