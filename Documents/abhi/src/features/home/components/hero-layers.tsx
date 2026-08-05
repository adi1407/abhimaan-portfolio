"use client";

import { cn } from "@/lib/cn";

/**
 * Layer stack for the hero document. Order is bottom-up — the same order
 * they land in during the build, and the reverse of how a Layers panel
 * lists them.
 */
export const LAYERS = [
  { id: "wash", label: "Background", blend: "Normal", opacity: 100 },
  { id: "plate", label: "Plate 01", blend: "Normal", opacity: 100 },
  { id: "grain", label: "Grain", blend: "Multiply", opacity: 38 },
  { id: "duotone", label: "Duotone", blend: "Overlay", opacity: 72 },
  { id: "curves", label: "Curves", blend: "Soft Light", opacity: 90 },
  { id: "type", label: "Type — COMPOSITE", blend: "Normal", opacity: 100 },
] as const;

export type LayerId = (typeof LAYERS)[number]["id"];

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
}: {
  built: number;
  hidden: Set<LayerId>;
  onToggle: (id: LayerId) => void;
  disabled: boolean;
}) {
  return (
    <aside className="psh-layers" aria-label="Layers">
      <div className="psh-layers__head">
        <span>Layers</span>
        <em>Normal · 100%</em>
      </div>

      <ul className="psh-layers__list">
        {/* Panels list top layer first. */}
        {[...LAYERS].reverse().map((layer) => {
          const index = LAYERS.findIndex((l) => l.id === layer.id);
          const isIn = index < built;
          const on = !hidden.has(layer.id);
          return (
            <li
              key={layer.id}
              className={cn(
                "psh-layers__row",
                isIn && "is-in",
                !on && "is-off",
              )}
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

              <span className={cn("psh-layers__thumb", `psh-layers__thumb--${layer.id}`)} aria-hidden />

              <span className="psh-layers__meta">
                <span className="psh-layers__name">{layer.label}</span>
                <span className="psh-layers__mode">
                  {layer.blend} · {layer.opacity}%
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
