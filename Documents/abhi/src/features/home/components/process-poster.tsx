"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Container } from "@/components/layout/container";
import { SplitText } from "@/components/motion/split-text";
import { TORN_CLIPS, TornDefs } from "@/features/home/components/torn-defs";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import { cn } from "@/lib/cn";
import { PROCESS_STEPS } from "@/lib/process";

/** Reads across the two bottom seal pieces — only resolves once assembled. */
const STATEMENT = "Waste nothing that argues";

type Piece = {
  /** `row-start / column-start / row-end / column-end` on a 2 × 7 grid. */
  area: string;
  /** -1 enters from the left, 1 from the right. */
  dir: -1 | 1;
  /** Stacking order — a piece must sit above every piece it tears over. */
  z: number;
  /** Resting tilt, so the assembled sheet reads as hand-laid. */
  tilt: string;
  /** Compact pieces drop the tag chips and clamp their body copy. */
  dense?: boolean;
};

/**
 * Assembled poster: two columns tiled without gaps, plus a signature strip
 * along the bottom. Pieces enter from their column side and land one by one.
 */
const PIECES: readonly Piece[] = [
  { area: "1 / 1 / 4 / 2", dir: -1, z: 6, tilt: "-0.4deg" },
  { area: "1 / 2 / 3 / 3", dir: 1, z: 4, tilt: "0.35deg", dense: true },
  { area: "3 / 2 / 5 / 3", dir: 1, z: 3, tilt: "-0.3deg", dense: true },
  { area: "4 / 1 / 7 / 2", dir: -1, z: 5, tilt: "0.3deg" },
  { area: "5 / 2 / 7 / 3", dir: 1, z: 2, tilt: "0.45deg", dense: true },
  { area: "7 / 1 / 8 / 2", dir: -1, z: 8, tilt: "-0.25deg" },
  { area: "7 / 2 / 8 / 3", dir: 1, z: 7, tilt: "0.2deg" },
];

/** Beat of stillness before the first tear flies in. */
const INTRO = 0.06;
/** Gap between successive piece start times (clear one-by-one). */
const SLOT = 0.12;
/** How long each piece spends in flight → land. */
const FLIGHT = 0.12;
/** Assembled bloom once the last seal has landed (~0.90). */
const WHOLE_AT = 0.92;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function pieceLocal(progress: number, index: number) {
  const start = INTRO + index * SLOT;
  const end = start + FLIGHT;
  const raw = (progress - start) / (end - start);
  return easeOutCubic(Math.min(1, Math.max(0, raw)));
}

export function ProcessPoster() {
  const soft = useReducedMotion();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [assembled, setAssembled] = useState(false);
  const assembledRef = useRef(false);

  const setAssembledOnce = useCallback((next: boolean) => {
    if (next === assembledRef.current) return;
    assembledRef.current = next;
    setAssembled(next);
  }, []);

  // Always scroll-driven — soft mode only kills blur, never freezes --p.
  const sectionRef = useScrollProgress<HTMLElement>({
    disabled: false,
    onProgress: (progress, el) => {
      el.style.setProperty("--p", progress.toFixed(4));

      const bloom = Math.min(
        1,
        Math.max(0, (progress - WHOLE_AT) / (1 - WHOLE_AT || 1)),
      );
      el.style.setProperty("--bloom", easeOutCubic(bloom).toFixed(4));

      const nodes = el.querySelectorAll<HTMLElement>(".piece");
      nodes.forEach((piece, i) => {
        const p = pieceLocal(progress, i);
        piece.style.setProperty("--p", p.toFixed(4));
        const reveal = Math.min(1, Math.max(0, (p - 0.45) / 0.5));
        piece.style.setProperty("--reveal", easeOutCubic(reveal).toFixed(4));
      });

      setAssembledOnce(progress >= WHOLE_AT);
    },
  });

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const sync = () => {
      const seals = sheet.querySelectorAll<HTMLElement>(".piece--seal");
      seals.forEach((piece) => {
        const stacked = piece.offsetWidth >= sheet.clientWidth - 1;
        piece.style.setProperty(
          "--seam-w",
          `${stacked ? piece.offsetWidth : sheet.clientWidth}px`,
        );
        piece.style.setProperty(
          "--seam-x",
          stacked ? "0px" : `${-piece.offsetLeft}px`,
        );
      });
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(sheet);
    return () => observer.disconnect();
  }, []);

  const isWhole = assembled;

  return (
    <section
      ref={sectionRef}
      className={cn("poster", soft && "poster--soft")}
      style={{
        ["--count" as string]: PIECES.length,
        ["--p" as string]: 0,
        ["--bloom" as string]: 0,
      }}
      aria-labelledby="process-heading"
    >
      <TornDefs />

      <div className="poster__stage">
        <Container className="poster__container">
          <header className="poster__head">
            <p className="poster__eyebrow">02 — Method</p>
            <SplitText
              as="h2"
              id="process-heading"
              className="poster__title"
              by="word"
            >
              How I design
            </SplitText>
            <p className="poster__lede">
              Five torn pieces of the same brief — they only hold together once
              every step has landed.
            </p>
          </header>

          <div
            ref={sheetRef}
            className={cn("poster__sheet", isWhole && "is-whole")}
          >
            {PIECES.map((piece, i) => {
              const step = PROCESS_STEPS[i];

              return (
                <article
                  key={TORN_CLIPS[i]}
                  className={cn(
                    "piece",
                    piece.dense && "piece--dense",
                    !step && "piece--seal",
                  )}
                  style={{
                    ["--area" as string]: piece.area,
                    ["--torn" as string]: `url(#${TORN_CLIPS[i]})`,
                    ["--dir" as string]: piece.dir,
                    ["--tilt" as string]: piece.tilt,
                    ["--z" as string]: piece.z,
                    ["--p" as string]: 0,
                    ["--reveal" as string]: 0,
                  }}
                  aria-hidden={step ? undefined : true}
                >
                  <span className="piece__rim">
                    <span className="piece__rim-fill" />
                  </span>

                  <div className="piece__sheet">
                    <span className="piece__grain" />

                    {step ? (
                      <div className="piece__body">
                        <div className="piece__top">
                          <span className="piece__num">{step.id}</span>
                          <span className="piece__tag">{step.tag}</span>
                        </div>

                        <h3 className="piece__title">{step.title}</h3>
                        <p className="piece__copy">{step.body}</p>

                        {piece.dense ? null : (
                          <ul className="piece__list">
                            {step.points.map((point) => (
                              <li key={point}>{point}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <span className="piece__statement">{STATEMENT}</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <p className="poster__a11y">{STATEMENT}</p>
        </Container>
      </div>
    </section>
  );
}
