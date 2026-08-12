"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import type { WorkItem } from "@/lib/work";

type ThumbCinemaProps = {
  items: readonly WorkItem[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  originEl: HTMLElement | null;
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

function waitForImage(img: HTMLImageElement, src: string): Promise<void> {
  return new Promise((resolve) => {
    if (!src) {
      resolve();
      return;
    }
    if (img.getAttribute("src") === src && img.complete && img.naturalWidth > 0) {
      resolve();
      return;
    }
    const done = () => {
      img.removeEventListener("load", done);
      img.removeEventListener("error", done);
      resolve();
    };
    img.addEventListener("load", done);
    img.addEventListener("error", done);
    img.src = src;
    if (img.complete && img.naturalWidth > 0) done();
  });
}

/**
 * Cinematic fullscreen viewer for thumbnails — waits for the frame,
 * then GSAP open. Lenis locked; portal to body; filmstrip + crossfade nav.
 */
export function ThumbCinema({
  items,
  index,
  onIndexChange,
  onClose,
}: ThumbCinemaProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgARef = useRef<HTMLImageElement>(null);
  const imgBRef = useRef<HTMLImageElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const gsapRef = useRef<GsapBundle | null>(null);
  const activeLayer = useRef<"a" | "b">("a");
  const navTween = useRef<{ kill: () => void } | null>(null);
  const closing = useRef(false);
  const opened = useRef(false);
  const prevIndex = useRef(index);
  const [ready, setReady] = useState(false);

  const item = items[index];
  const count = items.length;

  const scrollStripToActive = useCallback((smooth: boolean) => {
    const strip = stripRef.current;
    if (!strip) return;
    const active = strip.querySelector<HTMLElement>(".tcinema__thumb.is-on");
    if (!active) return;
    const left =
      active.offsetLeft - strip.clientWidth / 2 + active.clientWidth / 2;
    strip.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
  }, []);

  /* Load GSAP + first frame, then open timeline — after portal is in the DOM */
  useEffect(() => {
    let cancelled = false;
    let ctx: ReturnType<typeof import("gsap").gsap.context> | null = null;

    lockPageScroll();

    (async () => {
      const { gsap } = await import("gsap");
      if (cancelled) return;
      gsapRef.current = { gsap };
      setReady(true);

      /* Portal commit — wait one frame so refs attach */
      await new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      );
      if (cancelled) return;

      const root = rootRef.current;
      const front = imgARef.current;
      if (!root || !front || !item?.src) return;

      await waitForImage(front, item.src);
      if (cancelled) return;

      gsap.set(front, { opacity: 1, xPercent: 0 });
      if (imgBRef.current) {
        gsap.set(imgBRef.current, { opacity: 0, xPercent: 0 });
      }

      const runOpen = () => {
        if (cancelled) return;
        const scrim = scrimRef.current;
        const meta = metaRef.current;
        const stage = stageRef.current;
        const strip = stripRef.current;
        const navs = gsap.utils.toArray<HTMLElement>(
          root.querySelectorAll(".tcinema__nav, .tcinema__close"),
        );
        const reduce = prefersReducedMotion();

        /* Start state before revealing — no FOUC flash */
        if (!reduce) {
          gsap.set(scrim, { opacity: 0 });
          gsap.set(stage, {
            opacity: 0,
            scale: 0.92,
            y: 28,
            transformOrigin: "50% 50%",
          });
          gsap.set(meta ? Array.from(meta.children) : [], {
            opacity: 0,
            y: 14,
          });
          gsap.set(strip, { opacity: 0, y: 20 });
          gsap.set(navs, { opacity: 0 });
        }

        root.classList.add("is-ready");

        ctx = gsap.context(() => {
          if (reduce) {
            gsap.set([scrim, stage, strip, ...navs].filter(Boolean), {
              opacity: 1,
              clearProps: "transform",
            });
            if (meta) {
              gsap.set(Array.from(meta.children), {
                opacity: 1,
                clearProps: "transform",
              });
            }
            opened.current = true;
            scrollStripToActive(false);
            closeBtnRef.current?.focus({ preventScroll: true });
            return;
          }

          const tl = gsap.timeline({
            defaults: { ease: "power3.out" },
            onComplete: () => {
              opened.current = true;
              gsap.set([stage, ...navs], { clearProps: "transform" });
              scrollStripToActive(false);
              closeBtnRef.current?.focus({ preventScroll: true });
            },
          });

          tl.to(scrim, { opacity: 1, duration: 0.42 }, 0);
          tl.to(
            stage,
            {
              opacity: 1,
              scale: 1,
              y: 0,
              duration: 0.7,
              ease: "expo.out",
            },
            0.05,
          );
          if (meta) {
            tl.to(
              Array.from(meta.children),
              { opacity: 1, y: 0, duration: 0.5, stagger: 0.05 },
              0.28,
            );
          }
          if (strip) {
            tl.to(
              strip,
              { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
              0.36,
            );
          }
          tl.to(navs, { opacity: 1, duration: 0.35 }, 0.32);
        }, root);
      };

      requestAnimationFrame(() => requestAnimationFrame(runOpen));
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
      unlockPageScroll();
      navTween.current?.kill();
    };
    // Open once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Crossfade when index changes (after open) */
  useEffect(() => {
    if (!ready || !opened.current || closing.current) return;
    const bundle = gsapRef.current;
    if (!bundle || !item) return;
    const { gsap } = bundle;

    navTween.current?.kill();

    const reduce = prefersReducedMotion();
    const frontRef = activeLayer.current === "a" ? imgARef : imgBRef;
    const backRef = activeLayer.current === "a" ? imgBRef : imgARef;
    const front = frontRef.current;
    const back = backRef.current;
    if (!front || !back) return;

    if (front.getAttribute("src") === item.src) {
      scrollStripToActive(true);
      return;
    }

    const from = prevIndex.current;
    prevIndex.current = index;
    const forward = (index - from + count) % count;
    const backward = (from - index + count) % count;
    const dir = forward <= backward ? 1 : -1;

    const run = async () => {
      await waitForImage(back, item.src);
      if (closing.current) return;

      if (reduce) {
        gsap.set(front, { opacity: 0, xPercent: 0 });
        gsap.set(back, { opacity: 1, xPercent: 0 });
        activeLayer.current = activeLayer.current === "a" ? "b" : "a";
        scrollStripToActive(false);
        return;
      }

      gsap.set(back, { opacity: 0, xPercent: dir * 10 });
      const tl = gsap.timeline({
        onComplete: () => {
          activeLayer.current = activeLayer.current === "a" ? "b" : "a";
          gsap.set([front, back], { clearProps: "xPercent" });
          scrollStripToActive(true);
        },
      });
      tl.to(
        front,
        {
          opacity: 0,
          xPercent: -dir * 8,
          duration: 0.38,
          ease: "power2.inOut",
        },
        0,
      );
      tl.to(
        back,
        { opacity: 1, xPercent: 0, duration: 0.42, ease: "power2.out" },
        0.04,
      );
      navTween.current = tl;
    };

    void run();
  }, [index, item, ready, count, scrollStripToActive]);

  useEffect(() => {
    if (!ready || !opened.current) return;
    scrollStripToActive(true);
  }, [index, ready, scrollStripToActive]);

  const requestClose = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const bundle = gsapRef.current;
    const root = rootRef.current;

    if (!bundle || !root || prefersReducedMotion()) {
      unlockPageScroll();
      onClose();
      return;
    }

    const { gsap } = bundle;
    navTween.current?.kill();

    const navs = gsap.utils.toArray<HTMLElement>(
      root.querySelectorAll(".tcinema__nav, .tcinema__close"),
    );

    const tl = gsap.timeline({
      onComplete: () => {
        unlockPageScroll();
        onClose();
      },
    });

    tl.to(
      [metaRef.current, stripRef.current, ...navs],
      { opacity: 0, duration: 0.24, ease: "power2.in", stagger: 0.02 },
      0,
    );
    tl.to(
      stageRef.current,
      {
        opacity: 0,
        scale: 0.96,
        y: 14,
        duration: 0.32,
        ease: "power2.in",
      },
      0.04,
    );
    tl.to(scrimRef.current, { opacity: 0, duration: 0.28 }, 0.08);
  }, [onClose]);

  const step = useCallback(
    (dir: 1 | -1) => {
      if (closing.current || count < 2) return;
      onIndexChange((index + dir + count) % count);
    },
    [count, index, onIndexChange],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
      } else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose, step]);

  if (!item || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={rootRef}
      className="tcinema"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      <button
        ref={scrimRef}
        type="button"
        className="tcinema__scrim"
        aria-label="Close"
        onClick={requestClose}
      />

      <div ref={chromeRef} className="tcinema__chrome">
        <div className="tcinema__frame">
          <div ref={stageRef} className="tcinema__stage">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgARef}
              alt=""
              className="tcinema__img tcinema__img--a"
              decoding="async"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgBRef}
              alt=""
              className="tcinema__img tcinema__img--b"
              decoding="async"
            />
            <span className="tcinema__vignette" aria-hidden />
          </div>

          <div ref={metaRef} className="tcinema__meta">
            <p className="tcinema__kicker">Thumbnails · scroll-stop</p>
            <h3 className="tcinema__title">{item.title}</h3>
            <p className="tcinema__year">{item.year}</p>
            <p className="tcinema__count">
              {String(index + 1).padStart(2, "0")} /{" "}
              {String(count).padStart(2, "0")}
            </p>
          </div>
        </div>

        <div ref={stripRef} className="tcinema__strip" aria-label="All cuts">
          {items.map((thumb, i) => (
            <button
              key={thumb.id}
              type="button"
              className={cn("tcinema__thumb", i === index && "is-on")}
              onClick={() => onIndexChange(i)}
              aria-label={`${thumb.title}, ${i + 1} of ${count}`}
              aria-current={i === index ? "true" : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb.src} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="tcinema__nav tcinema__nav--prev"
        aria-label="Previous"
        onClick={() => step(-1)}
      >
        ←
      </button>
      <button
        type="button"
        className="tcinema__nav tcinema__nav--next"
        aria-label="Next"
        onClick={() => step(1)}
      >
        →
      </button>
      <button
        ref={closeBtnRef}
        type="button"
        className="tcinema__close"
        aria-label="Close"
        onClick={requestClose}
      >
        Close ✕
      </button>
    </div>,
    document.body,
  );
}
