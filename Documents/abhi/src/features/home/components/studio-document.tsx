"use client";

import { useEffect, useRef, useState } from "react";
import {
  HeroLayersPanel,
  LAYERS,
  type LayerId,
} from "@/features/home/components/hero-layers";
import { onViewport } from "@/lib/frame";
import { cn } from "@/lib/cn";

/* ================================================================== *
 * Studio document — nine uploaded plates composite on scroll.
 *
 * The section is taller than the viewport and pins its artboard. The
 * scroll distance through that pin IS the build: every layer gets its
 * own slice of the travel and fills across it, so the composite
 * assembles one layer at a time and un-assembles on the way back up.
 * ================================================================== */

const EMPTY_HIDDEN = new Set<LayerId>();
const noop = () => {};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Scroll room per layer, on top of one viewport for the pin itself. */
const SLICE_SVH = 38;

export function StudioDocument() {
  const sectionRef = useRef<HTMLElement>(null);
  const layerRefs = useRef<(HTMLElement | null)[]>([]);
  const railRef = useRef<HTMLSpanElement>(null);

  /* Integer count for the panel readout only — written when it changes
     so ordinary scroll frames stay pure DOM writes. */
  const [built, setBuilt] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let lastBuilt = -1;

    /* Shared frame loop — one scroll measurement per frame for the
       whole page instead of a listener per section. */
    return onViewport(({ vh: viewportH }) => {
      const rect = section.getBoundingClientRect();
      const vh = viewportH || 1;
      const travel = rect.height - vh;
      const p = travel > 0 ? clamp(-rect.top / travel, 0, 1) : 0;

      /* Spread p across the stack: layer i fills as `stepped` crosses
         i → i+1, which is what lands them in sequence. */
      const stepped = p * LAYERS.length;

      for (let i = 0; i < LAYERS.length; i += 1) {
        const el = layerRefs.current[i];
        if (!el) continue;
        el.style.setProperty("--t", smooth(clamp(stepped - i, 0, 1)).toFixed(4));
      }

      if (railRef.current) {
        railRef.current.style.setProperty("--p", p.toFixed(4));
      }

      const count = clamp(Math.floor(stepped + 0.35), 0, LAYERS.length);
      if (count !== lastBuilt) {
        lastBuilt = count;
        setBuilt(count);
      }
    });
  }, []);

  const done = built >= LAYERS.length;
  const landing = LAYERS[clamp(built, 0, LAYERS.length - 1)];

  return (
    <section
      ref={sectionRef}
      className="sdoc"
      aria-labelledby="sdoc-title"
      style={{
        ["--slice" as string]: `${SLICE_SVH}svh`,
        ["--slices" as string]: LAYERS.length,
      }}
    >
      <h2 id="sdoc-title" className="sr-only">
        The poster, composited layer by layer
      </h2>

      <div className="sdoc__pin">
        <div className={cn("psh", "sdoc__doc", done && "is-done")}>
          <div className="psh__titlebar" aria-hidden>
            <span className="psh__doc">
              abhimaan-2026.psd
              <em>RGB/8</em>
              <em>{LAYERS.length} layers</em>
            </span>
            <span className="psh__hint">
              {done ? "Composite complete" : "Scroll to composite"}
            </span>
          </div>

          <HeroLayersPanel
            built={built}
            hidden={EMPTY_HIDDEN}
            onToggle={noop}
            disabled
          />

          <div className="psh__viewport">
            <div className="psh__stage sdoc__stage">
              <span className="psh__checker" aria-hidden />

              {LAYERS.map((layer, i) => (
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
              {done ? "Composite complete" : `Placing — ${landing.label}`}
            </span>
            <span ref={railRef} className="sdoc__rail">
              <i />
            </span>
            <span className="sdoc__count">
              {built} / {LAYERS.length}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
