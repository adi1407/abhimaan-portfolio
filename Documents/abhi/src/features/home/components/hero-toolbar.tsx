"use client";

import { cn } from "@/lib/cn";

export type ToolId = "move" | "marquee" | "dropper" | "brush" | "hand" | "zoom";

const TOOLS: { id: ToolId; key: string; label: string; hint: string }[] = [
  { id: "move", key: "V", label: "Move", hint: "Look around" },
  { id: "marquee", key: "M", label: "Marquee", hint: "Drag a selection to cut through" },
  { id: "dropper", key: "I", label: "Eyedropper", hint: "Click the art to retint the site" },
  { id: "brush", key: "B", label: "Brush", hint: "Paint the layer underneath back in" },
  { id: "hand", key: "H", label: "Hand", hint: "Drag to pan the artboard" },
  { id: "zoom", key: "Z", label: "Zoom", hint: "Click to zoom · shift-click out" },
];

function Icon({ id }: { id: ToolId }) {
  switch (id) {
    case "move":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "marquee":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <rect
            x="3.5"
            y="4.5"
            width="17"
            height="15"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="3 2.4"
          />
        </svg>
      );
    case "dropper":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M15.6 3.8a2.7 2.7 0 0 1 3.8 3.8l-1.6 1.6 1 1-1.5 1.5-1-1-6.4 6.4-3.6.9.9-3.6 6.4-6.4-1-1L13.1 5.4l1 1 1.5-1.6Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "brush":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M17.6 3.9a2.2 2.2 0 0 1 3.1 3.1l-8 8-3.6.5.5-3.6 8-8Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M8.4 14.6c-1.9.6-2.2 2.3-2.6 3.6-.3 1-1 1.6-2.4 1.8 1 1.2 2.5 1.6 3.9 1.2 1.9-.5 3-2.2 2.7-4.1"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "hand":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M9 11V5.6a1.3 1.3 0 0 1 2.6 0V11m0-.6V4.4a1.3 1.3 0 0 1 2.6 0V11m0-.8V6.2a1.3 1.3 0 1 1 2.6 0V13m-10.4-.4V9.4a1.3 1.3 0 0 0-2.6 0v5.2c0 3.4 2.5 6 6 6h1.7c3 0 5-2.2 5-5.2v-3"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "zoom":
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="6.4" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M15.8 15.8 21 21M8.6 11h4.8M11 8.6v4.8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

export function HeroToolbar({
  tool,
  onPick,
  disabled,
}: {
  tool: ToolId;
  onPick: (id: ToolId) => void;
  disabled: boolean;
}) {
  const active = TOOLS.find((t) => t.id === tool);

  return (
    <div className="psh-tools" role="toolbar" aria-label="Tools">
      <div className="psh-tools__rail">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={cn("psh-tools__btn", tool === t.id && "is-on")}
            onClick={() => onPick(t.id)}
            disabled={disabled}
            aria-pressed={tool === t.id}
            title={`${t.label} (${t.key})`}
          >
            <Icon id={t.id} />
            <span className="psh-tools__key" aria-hidden>
              {t.key}
            </span>
            <span className="sr-only">{t.label}</span>
          </button>
        ))}
      </div>

      {active ? (
        <p className="psh-tools__hint" aria-live="polite">
          <strong>{active.label}</strong>
          {active.hint}
        </p>
      ) : null}
    </div>
  );
}
