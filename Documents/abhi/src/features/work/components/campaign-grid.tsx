"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";
import type { Campaign, CampaignImage } from "@/lib/campaigns";

type CampaignGridProps = {
  campaign: Campaign;
  originEl: HTMLElement | null;
  onClose: () => void;
};

type GsapBundle = {
  gsap: typeof import("gsap").gsap;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function lockPageScroll() {
  window.__lenis?.stop();
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
}

function unlockPageScroll() {
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  window.__lenis?.start();
}

/**
 * Fullscreen campaign mosaic — equal-size poster sheet, GSAP open/close,
 * overlay scrollport (Lenis stopped), cell lightbox.
 */
export function CampaignGrid({ campaign, onClose }: CampaignGridProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const mosaicRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const gsapRef = useRef<GsapBundle | null>(null);
  const closing = useRef(false);
  const opened = useRef(false);
  const [ready, setReady] = useState(false);
  const [lbIndex, setLbIndex] = useState<number | null>(null);

  const images = campaign.images;
  const count = images.length;

  useLayoutEffect(() => {
    let cancelled = false;
    let ctx: ReturnType<typeof import("gsap").gsap.context> | null = null;

    lockPageScroll();

    (async () => {
      const { gsap } = await import("gsap");
      if (cancelled) return;
      gsapRef.current = { gsap };
      setReady(true);

      const root = rootRef.current;
      if (!root) return;

      const runOpen = () => {
        if (cancelled) return;
        ctx = gsap.context(() => {
          const reduce = prefersReducedMotion();
          const scrim = scrimRef.current;
          const shell = shellRef.current;
          const mosaic = mosaicRef.current;
          const cells = mosaic
            ? gsap.utils.toArray<HTMLElement>(
                mosaic.querySelectorAll(".cgrid__cell"),
              )
            : [];

          if (reduce) {
            gsap.set([scrim, shell].filter(Boolean), { opacity: 1 });
            gsap.set(cells, { opacity: 1, clearProps: "transform" });
            opened.current = true;
            closeBtnRef.current?.focus({ preventScroll: true });
            return;
          }

          gsap.set(scrim, { opacity: 0 });
          gsap.set(shell, { opacity: 0, scale: 0.96, y: 18 });
          gsap.set(cells, {
            opacity: 0,
            y: 24,
            scale: 0.96,
          });

          const tl = gsap.timeline({
            defaults: { ease: "power3.out" },
            onComplete: () => {
              opened.current = true;
              closeBtnRef.current?.focus({ preventScroll: true });
            },
          });

          tl.to(scrim, { opacity: 1, duration: 0.4 }, 0);
          tl.to(
            shell,
            {
              opacity: 1,
              scale: 1,
              y: 0,
              duration: 0.55,
              ease: "expo.out",
            },
            0.06,
          );
          if (cells.length) {
            tl.to(
              cells,
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.55,
                stagger: 0.05,
                ease: "expo.out",
                clearProps: "transform",
              },
              0.18,
            );
          }
        }, root);
      };

      requestAnimationFrame(() => requestAnimationFrame(runOpen));
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
      unlockPageScroll();
    };
  }, []);

  const requestClose = useCallback(() => {
    if (closing.current) return;
    if (lbIndex !== null) {
      setLbIndex(null);
      return;
    }
    closing.current = true;
    const bundle = gsapRef.current;
    const root = rootRef.current;

    if (!bundle || !root || prefersReducedMotion()) {
      unlockPageScroll();
      onClose();
      return;
    }

    const { gsap } = bundle;
    const cells = mosaicRef.current
      ? gsap.utils.toArray<HTMLElement>(
          mosaicRef.current.querySelectorAll(".cgrid__cell"),
        )
      : [];

    const tl = gsap.timeline({
      onComplete: () => {
        unlockPageScroll();
        onClose();
      },
    });

    tl.to(
      cells,
      {
        opacity: 0,
        y: 14,
        scale: 0.97,
        duration: 0.28,
        stagger: 0.02,
        ease: "power2.in",
      },
      0,
    );
    tl.to(
      shellRef.current,
      { opacity: 0, scale: 0.97, y: 10, duration: 0.3, ease: "power2.in" },
      0.06,
    );
    tl.to(scrimRef.current, { opacity: 0, duration: 0.28 }, 0.08);
  }, [onClose, lbIndex]);

  const stepLb = useCallback(
    (dir: 1 | -1) => {
      setLbIndex((cur) =>
        cur === null ? cur : (cur + dir + count) % count,
      );
    },
    [count],
  );

  useEffect(() => {
    if (!ready) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
      } else if (lbIndex !== null) {
        if (e.key === "ArrowRight") stepLb(1);
        else if (e.key === "ArrowLeft") stepLb(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready, requestClose, lbIndex, stepLb]);

  /* Focus trap — prefer close button as entry focus */
  useEffect(() => {
    if (!ready) return;
    const root = rootRef.current;
    if (!root) return;
    const focusable = Array.from(
      root.querySelectorAll<HTMLElement>(
        'button:not(.cgrid-lb__scrim), [href], [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => lbIndex !== null || !el.closest(".cgrid-lb"));

    const first = focusable[0] ?? closeBtnRef.current;
    const last = focusable[focusable.length - 1] ?? first;
    if (!opened.current) {
      /* open timeline will focus close when ready */
    } else {
      first?.focus({ preventScroll: true });
    }

    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || focusable.length === 0) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    root.addEventListener("keydown", onTab);
    return () => root.removeEventListener("keydown", onTab);
  }, [ready, lbIndex]);

  const lbItem = lbIndex !== null ? images[lbIndex] : null;

  const renderCell = (img: CampaignImage, i: number) => (
    <button
      key={img.id}
      type="button"
      className="cgrid__cell"
      onClick={() => setLbIndex(i)}
      aria-label={`Open ${img.label}`}
    >
      <img src={img.src} alt={img.label} loading="lazy" draggable={false} />
    </button>
  );

  return (
    <div
      ref={rootRef}
      className="cgrid"
      role="dialog"
      aria-modal="true"
      aria-label={`${campaign.title} campaign board`}
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div ref={scrimRef} className="cgrid__scrim" aria-hidden />

      <div
        ref={shellRef}
        className="cgrid__shell"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cgrid__head">
          <div className="cgrid__meta">
            <p className="cgrid__kicker">Campaign board</p>
            <h2 className="cgrid__title">{campaign.title}</h2>
            <p className="cgrid__sub">{campaign.subtitle}</p>
          </div>
          <p className="cgrid__count">
            {count} piece{count === 1 ? "" : "s"}
          </p>
          <button
            ref={closeBtnRef}
            type="button"
            className="cgrid__close"
            aria-label="Close"
            onClick={requestClose}
          >
            ×
          </button>
        </header>

        <div
          ref={mosaicRef}
          className={cn("cgrid__mosaic", `cgrid__mosaic--${campaign.layout}`)}
        >
          {images.map((img, i) => renderCell(img, i))}
        </div>
      </div>

      {lbItem && lbIndex !== null ? (
        <div className="cgrid-lb" role="dialog" aria-label={lbItem.label}>
          <button
            type="button"
            className="cgrid-lb__scrim"
            aria-label="Close image"
            tabIndex={-1}
            onClick={() => setLbIndex(null)}
          />
          <button
            type="button"
            className="cgrid-lb__nav cgrid-lb__nav--prev"
            aria-label="Previous"
            onClick={() => stepLb(-1)}
          >
            ‹
          </button>
          <figure className="cgrid-lb__figure">
            <img src={lbItem.src} alt={lbItem.label} draggable={false} />
            <figcaption>
              {lbItem.label}
              <span>
                {lbIndex + 1} / {count}
              </span>
            </figcaption>
          </figure>
          <button
            type="button"
            className="cgrid-lb__nav cgrid-lb__nav--next"
            aria-label="Next"
            onClick={() => stepLb(1)}
          >
            ›
          </button>
          <button
            type="button"
            className="cgrid-lb__close"
            aria-label="Close image"
            onClick={() => setLbIndex(null)}
          >
            ×
          </button>
        </div>
      ) : null}
    </div>
  );
}
