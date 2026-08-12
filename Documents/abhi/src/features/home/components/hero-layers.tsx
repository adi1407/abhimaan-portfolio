"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Layer stack for the studio document. Order is bottom-up — the same
 * order they land in during the scroll build, and the reverse of how a
 * Layers panel lists them. Assets live in /public/photoshop.
 */
export const LAYERS = [
  {
    id: "l1",
    label: "Base Plate",
    blend: "Normal",
    opacity: 100,
    src: "/photoshop/1.jpg.webp",
    mode: "normal",
  },
  {
    id: "l2",
    label: "Light Streaks",
    blend: "Screen",
    opacity: 100,
    src: "/photoshop/2.webp",
    mode: "screen",
  },
  {
    id: "l3",
    label: "Atmosphere",
    blend: "Screen",
    opacity: 100,
    src: "/photoshop/3.webp",
    mode: "screen",
  },
  {
    id: "l4",
    label: "Glow Pass",
    blend: "Screen",
    opacity: 100,
    src: "/photoshop/4.webp",
    mode: "screen",
  },
  {
    id: "l5",
    label: "Hero Detail",
    blend: "Normal",
    opacity: 100,
    src: "/photoshop/5.webp",
    mode: "normal",
  },
  {
    id: "l6",
    label: "Highlights",
    blend: "Screen",
    opacity: 100,
    src: "/photoshop/6.webp",
    mode: "screen",
  },
  {
    id: "l7",
    label: "FX Pass",
    blend: "Screen",
    opacity: 100,
    src: "/photoshop/7.webp",
    mode: "screen",
  },
  {
    id: "l8",
    label: "Depth",
    blend: "Screen",
    opacity: 100,
    src: "/photoshop/8.webp",
    mode: "screen",
  },
  {
    id: "l9",
    label: "Type & UI",
    blend: "Screen",
    opacity: 100,
    src: "/photoshop/9.webp",
    mode: "screen",
  },
] as const;

export type StudioLayer = {
  id: string;
  label: string;
  blend: string;
  opacity: number;
  src: string;
  mode: string;
};

export type LayerId = string;

function Eye({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      {on ? (
        <>
          <path
            d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="12" cy="12" r="2.6" fill="currentColor" />
        </>
      ) : (
        <path
          d="M4 4l16 16M9.9 5.7A9.6 9.6 0 0 1 12 5.5c6.4 0 10 6.5 10 6.5a17 17 0 0 1-3.3 4M6.6 8.1A17 17 0 0 0 2 12s3.6 6.5 10 6.5a9.9 9.9 0 0 0 3.4-.6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function HeroLayersPanel({
  built,
  hidden,
  onToggle,
  disabled,
  layers = LAYERS as unknown as StudioLayer[],
}: {
  built: number;
  hidden: Set<LayerId>;
  onToggle: (id: LayerId) => void;
  disabled: boolean;
  layers?: StudioLayer[];
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const liveRef = useRef<HTMLLIElement | null>(null);
  const liveIndex = Math.max(0, built - 1);

  /* Keep the landing layer in view on the mobile filmstrip. */
  useEffect(() => {
    const el = liveRef.current;
    if (!el || built <= 0) return;
    el.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [built]);

  return (
    <aside className="psh-layers" aria-label="Layers">
      <div className="psh-layers__head">
        <span className="psh-layers__head-title">
          <i className="psh-layers__pulse" aria-hidden />
          Layers
        </span>
        <em>
          {Math.min(built, layers.length)}/{layers.length}
        </em>
      </div>

      <ul ref={listRef} className="psh-layers__list">
        {/* Panels list top layer first. */}
        {[...layers].reverse().map((layer) => {
          const index = layers.findIndex((l) => l.id === layer.id);
          const isIn = index < built;
          const isLive = isIn && index === liveIndex;
          const on = !hidden.has(layer.id);
          const n = String(index + 1).padStart(2, "0");
          return (
            <li
              key={layer.id}
              ref={isLive ? (node) => { liveRef.current = node; } : undefined}
              className={cn(
                "psh-layers__row",
                isIn && "is-in",
                isLive && "is-live",
                !on && "is-off",
              )}
              style={{ ["--li" as string]: index }}
            >
              <button
                type="button"
                className="psh-layers__eye"
                onClick={() => onToggle(layer.id)}
                disabled={disabled || !isIn}
                aria-label={`${on ? "Hide" : "Show"} ${layer.label}`}
                aria-pressed={on}
              >
                <Eye on={on} />
              </button>

              <span
                className={cn(
                  "psh-layers__thumb",
                  `psh-layers__thumb--${layer.id}`,
                )}
                style={{ backgroundImage: `url("${layer.src}")` }}
                aria-hidden
              >
                <em className="psh-layers__idx">{n}</em>
              </span>

              <span className="psh-layers__meta">
                <span className="psh-layers__name">{layer.label}</span>
                <span className="psh-layers__mode">
                  {layer.blend} · {layer.opacity}%
                </span>
              </span>

              {isLive ? (
                <span className="psh-layers__live" aria-hidden>
                  Live
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
