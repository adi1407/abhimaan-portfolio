"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import type { Campaign } from "@/lib/campaigns";
import { useCampaigns } from "@/lib/cms/hooks";
import { CampaignGrid } from "@/features/work/components/campaign-grid";

/**
 * Cover strip for campaign mosaics — sits between WorkFilm and GalleryWall.
 * Click a cover → fullscreen CampaignGrid.
 */
export function CampaignBoards() {
  const campaigns = useCampaigns() as unknown as Campaign[];
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const entered = useRef(false);
  const [active, setActive] = useState<{
    campaign: Campaign;
    origin: HTMLElement | null;
  } | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  /* GSAP stagger-in when section enters view */
  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.classList.add("is-in");
      return;
    }

    let cancelled = false;
    let ctx: { revert: () => void } | null = null;
    let io: IntersectionObserver | null = null;

    const run = async () => {
      if (entered.current || cancelled) return;
      entered.current = true;
      const { gsap } = await import("gsap");
      if (cancelled) return;

      ctx = gsap.context(() => {
        const cards = gsap.utils.toArray<HTMLElement>(
          root.querySelectorAll(".cboards__card"),
        );
        const head = root.querySelectorAll(".cboards__kicker, .cboards__title");

        gsap.set(head, { opacity: 0, y: 16 });
        gsap.set(cards, { opacity: 0, y: 40, scale: 0.97 });

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.to(head, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.06,
        });
        tl.to(
          cards,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.65,
            stagger: 0.1,
            ease: "expo.out",
            clearProps: "transform",
          },
          0.12,
        );
        root.classList.add("is-in");
      }, root);
    };

    const rect = root.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
      void run();
    } else if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          void run();
          io?.disconnect();
        },
        { threshold: 0.12, rootMargin: "0px 0px -4% 0px" },
      );
      io.observe(root);
    } else {
      void run();
    }

    return () => {
      cancelled = true;
      io?.disconnect();
      ctx?.revert();
    };
  }, []);

  const open = useCallback((campaign: Campaign, index: number) => {
    setActive({
      campaign,
      origin: cardRefs.current[index]?.querySelector(".cboards__media") ?? null,
    });
  }, []);

  const close = useCallback(() => setActive(null), []);

  return (
    <section
      ref={sectionRef}
      className="cboards"
      id="campaign-boards"
      aria-labelledby="cboards-title"
    >
      <div className="cboards__inner">
        <p className="cboards__kicker">Campaign boards</p>
        <h2 id="cboards-title" className="cboards__title">
          Full sets, one board
        </h2>

        <ul className="cboards__strip">
          {campaigns.map((campaign, i) => (
            <li key={campaign.id}>
              <button
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                type="button"
                className="cboards__card"
                onClick={() => open(campaign, i)}
                aria-label={`Open ${campaign.title}, ${campaign.images.length} pieces`}
              >
                <span
                  className={cn(
                    "cboards__media",
                    campaign.images[0]?.aspect === "sheet" &&
                      "cboards__media--sheet",
                  )}
                >
                  <img
                    src={campaign.cover}
                    alt=""
                    loading="lazy"
                    draggable={false}
                  />
                  <span className="cboards__shine" aria-hidden />
                </span>
                <span className="cboards__caption">
                  <span className="cboards__name">{campaign.title}</span>
                  <span className="cboards__meta">
                    <span className="cboards__sub">{campaign.subtitle}</span>
                    <span className="cboards__pieces">
                      {campaign.images.length} pcs
                    </span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {portalReady &&
        active &&
        createPortal(
          <CampaignGrid
            campaign={active.campaign}
            originEl={active.origin}
            onClose={close}
          />,
          document.body,
        )}
    </section>
  );
}
