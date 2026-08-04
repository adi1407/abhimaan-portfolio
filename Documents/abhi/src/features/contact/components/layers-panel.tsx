"use client";

export type LayerIconType =
  | "person"
  | "at"
  | "phone"
  | "briefcase"
  | "image"
  | "clock"
  | "tag"
  | "lines";

export type LayerItem = {
  key: string;
  label: string;
  icon: LayerIconType;
  value: string;
  filled: boolean;
  active: boolean;
};

function LayerIcon({ type }: { type: LayerIconType }) {
  switch (type) {
    case "person":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M5 20c1.2-4 4-6 7-6s5.8 2 7 6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "at":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12.5" r="4" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M16 12.5V14a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.6 7.2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "phone":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M6 4h3l1.4 4.3-2 1.6a12 12 0 0 0 5.7 5.7l1.6-2L20 15v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4 6.2 2 2 0 0 1 6 4Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "briefcase":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="4" y="8" width="16" height="11" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M9 8V6.6A1.6 1.6 0 0 1 10.6 5h2.8A1.6 1.6 0 0 1 15 6.6V8"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M4 13h16" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    case "image":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="4" y="5" width="16" height="14" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="9" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M5 17l5-5 3.5 3.5L17 12l3 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "tag":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M11.5 4h5A1.5 1.5 0 0 1 18 5.5v5a1.5 1.5 0 0 1-.44 1.06l-7 7a1.5 1.5 0 0 1-2.12 0l-4-4a1.5 1.5 0 0 1 0-2.12l7-7A1.5 1.5 0 0 1 11.5 4Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="14.2" cy="7.8" r="1.1" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case "lines":
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M5 6h14M5 12h14M5 18h9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

export function LayersPanel({
  layers,
  flattening,
}: {
  layers: LayerItem[];
  flattening: boolean;
}) {
  return (
    <aside className={`layers-panel${flattening ? " is-flattening" : ""}`} aria-hidden>
      <div className="layers-panel__chrome">
        <p className="layers-panel__title">Layers</p>
        <span className="layers-panel__badge">Artboard 1</span>
      </div>
      <ul className="layers-panel__list">
        {layers.map((layer, i) => (
          <li
            key={layer.key}
            className={[
              "layers-panel__row",
              layer.active ? "is-active" : "",
              layer.filled ? "is-filled" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ ["--i" as string]: i }}
          >
            <span className="layers-panel__eye">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </span>
            <span className="layers-panel__thumb">
              <LayerIcon type={layer.icon} />
            </span>
            <span className="layers-panel__meta">
              <span className="layers-panel__name">{layer.label}</span>
              {layer.filled ? (
                <span className="layers-panel__preview">{layer.value}</span>
              ) : null}
            </span>
            <span className="layers-panel__lock" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none">
                <rect
                  x="6"
                  y="11"
                  width="12"
                  height="9"
                  rx="1.4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M9 11V8.5a3 3 0 0 1 6 0V11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
