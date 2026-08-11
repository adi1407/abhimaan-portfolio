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
  Flip: typeof import("gsap/Flip").Flip;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isDesktopFlip() {
  return window.matchMedia("(min-width: 900px)").matches;
}

/**
 * Fullscreen campaign mosaic — GSAP Flip from cover, staggered cells,
 * simple lightbox for individual posters.
 */
export function CampaignGrid({
  campaign,
  originEl,
  onClose,
}: CampaignGridProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLButtonElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const mosaicRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLButtonElement>(null);
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

    (async () => {
      const [{ gsap }, { Flip }] = await Promise.all([
        import("gsap"),
        import("gsap/Flip"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(Flip);
      gsapRef.current = { gsap, Flip };
      setReady(true);

      const root = rootRef.current;
      if (!root) return;

      const runOpen = () => {
        if (cancelled) return;
        ctx = gsap.context(() => {
          const reduce = prefersReducedMotion();
          const useFlip = !reduce && isDesktopFlip() && originEl?.isConnected;
          const scrim = scrimRef.current;
          const shell = shellRef.current;
          const mosaic = mosaicRef.current;
          const hero = heroRef.current;
          const cells = mosaic
            ? gsap.utils.toArray<HTMLElement>(
                mosaic.querySelectorAll(".cgrid__cell"),
              )
            : [];
          const satellites = cells.filter((el) => el !== hero);

          document.body.style.overflow = "hidden";

          if (reduce) {
            gsap.set([scrim, shell].filter(Boolean), { opacity: 1 });
            gsap.set(cells, { opacity: 1, clearProps: "transform" });
            opened.current = true;
            return;
          }

          gsap.set(scrim, { opacity: 0 });
          gsap.set(shell, { opacity: 1 });
          gsap.set(satellites, {
            opacity: 0,
            y: 28,
            rotate: 1.2,
            scale: 0.96,
          });
          if (hero) gsap.set(hero, { opacity: 1 });

          const tl = gsap.timeline({
            defaults: { ease: "power3.out" },
            onComplete: () => {
              opened.current = true;
            },
          });

          tl.to(scrim, { opacity: 1, duration: 0.4 }, 0);

          if (useFlip && hero && originEl) {
            const state = Flip.getState(originEl);
            Flip.from(state, {
              targets: hero,
              absolute: true,
              duration: 0.7,
              ease: "expo.out",
              fade: true,
              scale: true,
              simple: true,
            });
          } else if (shell) {
            tl.fromTo(
              shell,
              { opacity: 0, scale: 0.94, y: 20 },
              {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.55,
                ease: "expo.out",
              },
              0.05,
            );
          }

          if (satellites.length) {
            tl.to(
              satellites,
              {
                opacity: 1,
                y: 0,
                rotate: 0,
                scale: 1,
                duration: 0.55,
                stagger: 0.05,
                ease: "expo.out",
                clearProps: "transform",
              },
              useFlip ? 0.35 : 0.2,
            );
          }
        }, root);
      };

      requestAnimationFrame(() => requestAnimationFrame(runOpen));
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      document.body.style.overflow = "";
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
        document.body.style.overflow = "";
        onClose();
      },
    });

    tl.to(
      cells,
      {
        opacity: 0,
        y: 16,
        scale: 0.97,
        duration: 0.28,
        stagger: 0.02,
        ease: "power2.in",
      },
      0,
    );
    tl.to(
      shellRef.current,
      { opacity: 0, scale: 0.96, duration: 0.32, ease: "power2.in" },
      0.08,
    );
    tl.to(scrimRef.current, { opacity: 0, duration: 0.3 }, 0.1);
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

  /* Focus trap — keep Tab inside overlay */
  useEffect(() => {
    if (!ready) return;
    const root = rootRef.current;
    if (!root) return;
    const focusable = root.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus({ preventScroll: true });

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

  const renderCell = (
    img: CampaignImage,
    i: number,
    opts?: { hero?: boolean; final?: boolean },
  ) => {
    const aspect = img.aspect ?? "story";
    return (
      <button
        key={img.id}
        ref={opts?.hero ? heroRef : undefined}
        type="button"
        className={cn(
          "cgrid__cell",
          `cgrid__cell--${aspect}`,
          opts?.hero && "cgrid__cell--hero",
          opts?.final && "cgrid__cell--final",
        )}
        onClick={() => setLbIndex(i)}
        aria-label={`Open ${img.label}`}
      >
        <img
          src={img.src}
          alt={img.label}
          loading="lazy"
          draggable={false}
        />
      </button>
    );
  };

  return (
    <div
      ref={rootRef}
      className="cgrid"
      role="dialog"
      aria-modal="true"
      aria-label={`${campaign.title} campaign board`}
    >
      <button
        ref={scrimRef}
        type="button"
        className="cgrid__scrim"
        aria-label="Close campaign board"
        onClick={requestClose}
      />

      <div ref={shellRef} className="cgrid__shell">
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
          {campaign.layout === "mosaic-6a" ? (
            <>
              <div className="cgrid__feature">
                {renderCell(images[0], 0, { hero: true })}
              </div>
              <div className="cgrid__satellites">
                {images.slice(1).map((img, i) => renderCell(img, i + 1))}
              </div>
            </>
          ) : campaign.layout === "mosaic-8" ? (
            <>
              <div className="cgrid__feature">
                {renderCell(images[0], 0, { hero: true, final: true })}
              </div>
              <div className="cgrid__satellites">
                {images.slice(1).map((img, i) => renderCell(img, i + 1))}
              </div>
            </>
          ) : (
            images.map((img, i) =>
              renderCell(img, i, { hero: i === 0 }),
            )
          )}
        </div>
      </div>

      {lbItem && lbIndex !== null ? (
        <div className="cgrid-lb" role="dialog" aria-label={lbItem.label}>
          <button
            type="button"
            className="cgrid-lb__scrim"
            aria-label="Close image"
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
