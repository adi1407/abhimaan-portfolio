"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  HeroLayersPanel,
  LAYERS,
  type LayerId,
  type StudioLayer,
} from "@/features/home/components/hero-layers";
import { onViewport } from "@/lib/frame";
import { cn } from "@/lib/cn";
import { useHome } from "@/lib/cms/hooks";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/* ================================================================== *
 * Studio document — nine uploaded plates composite on scroll.
 *
 * The section is taller than the viewport and pins its artboard. The
 * scroll distance through that pin IS the build. Keep the scrub short
 * so sticky never feels like a scroll trap, and always resume Lenis
 * if another interaction left it stopped.
 * ================================================================== */

const EMPTY_HIDDEN = new Set<LayerId>();
const noop = () => {};
const MOBILE_MQ = "(max-width: 900px)";

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Scroll room per layer — short so the pin does not feel stuck. */
const SLICE_SVH = 16;
const SLICE_SVH_MOBILE = 12;

export function StudioDocument() {
  const home = useHome<{
    studio?: { filename?: string; title?: string; layers?: StudioLayer[] };
  }>();
  const cmsLayers = home.studio?.layers;
  const layers: StudioLayer[] = useMemo(
    () => (cmsLayers?.length ? cmsLayers : [...LAYERS]),
    [cmsLayers],
  );
  const filename = home.studio?.filename || "abhimaan-2026.psd";
  const title =
    home.studio?.title || "The poster, composited layer by layer";
  const sectionRef = useRef<HTMLElement>(null);
  const layerRefs = useRef<(HTMLElement | null)[]>([]);
  const railRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  const [built, setBuilt] = useState(0);
  const [mobileStudio, setMobileStudio] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const sync = () => setMobileStudio(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /* If Lenis was left stopped elsewhere, resume when this section shows. */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) window.__lenis?.start();
      },
      { threshold: 0.05 },
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (reduced) {
      for (let i = 0; i < layers.length; i += 1) {
        layerRefs.current[i]?.style.setProperty("--t", "1");
      }
      railRef.current?.style.setProperty("--p", "1");
      setBuilt(layers.length);
      return;
    }

    let lastBuilt = -1;

    return onViewport(({ vh: viewportH }) => {
      const rect = section.getBoundingClientRect();
      const vh = viewportH || 1;
      const travel = Math.max(1, rect.height - vh);
      /* Finish the composite a bit before the pin releases. */
      const raw = clamp(-rect.top / travel, 0, 1);
      const p = raw >= 0.92 ? 1 : raw / 0.92;

      const stepped = p * layers.length;

      for (let i = 0; i < layers.length; i += 1) {
        const el = layerRefs.current[i];
        if (!el) continue;
        el.style.setProperty(
          "--t",
          smooth(clamp(stepped - i, 0, 1)).toFixed(4),
        );
      }

      if (railRef.current) {
        railRef.current.style.setProperty("--p", p.toFixed(4));
      }

      const count = clamp(Math.floor(stepped + 0.35), 0, layers.length);
      if (count !== lastBuilt) {
        lastBuilt = count;
        setBuilt(count);
      }
    });
  }, [mobileStudio, layers, reduced]);

  const done = built >= layers.length;
  const landing = layers[clamp(built, 0, layers.length - 1)];
  const slice = mobileStudio ? SLICE_SVH_MOBILE : SLICE_SVH;

  return (
    <section
      ref={sectionRef}
      className={cn(
        "sdoc",
        mobileStudio && "sdoc--mobile",
        reduced && "sdoc--static",
      )}
      aria-labelledby="sdoc-title"
      style={{
        ["--slice" as string]: `${slice}svh`,
        ["--slices" as string]: layers.length,
      }}
    >
      <h2 id="sdoc-title" className="sr-only">
        {title}
      </h2>

      <div className="sdoc__pin">
        <div className={cn("psh", "sdoc__doc", done && "is-done")}>
          <div className="psh__titlebar" aria-hidden>
            <span className="psh__doc">
              {filename}
              <em>RGB/8</em>
              <em>{layers.length} layers</em>
            </span>
            <span className="psh__hint">
              {done
                ? "Composite complete"
                : mobileStudio
                  ? "Scroll to build"
                  : "Scroll to composite"}
            </span>
          </div>

          <HeroLayersPanel
            built={built}
            hidden={EMPTY_HIDDEN}
            onToggle={noop}
            disabled
            layers={layers}
          />

          <div className="psh__viewport">
            <div className="psh__stage sdoc__stage">
              <span className="psh__checker" aria-hidden />

              {layers.map((layer, i) => (
                <span
                  key={layer.id}
                  ref={(el) => {
                    layerRefs.current[i] = el;
                  }}
                  className={cn(
                    "psh__layer",
                    "sdoc__layer",
                    `sdoc__layer--${layer.mode}`,
                    `sdoc__layer--${layer.id}`,
                  )}
                  style={{
                    backgroundImage: `url("${layer.src}")`,
                    zIndex: i + 1,
                  }}
                  aria-hidden
                />
              ))}
            </div>
          </div>

          <div className="psh__status" aria-hidden>
            <span className="sdoc__now">
              {done ? "Composite complete" : `Placing — ${landing?.label ?? ""}`}
            </span>
            <span ref={railRef} className="sdoc__rail">
              <i />
            </span>
            <span className="sdoc__count">
              {built} / {layers.length}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
