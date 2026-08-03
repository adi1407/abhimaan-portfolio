import { SITE } from "@/lib/constants";

const COLUMNS = 12;
const CORNERS = ["tl", "tr", "bl", "br"] as const;

/**
 * Hero staging — the hero presented as a press sheet rather than a webpage.
 * A real 12-column layout grid, printer's crop marks at the trim corners,
 * margin micro-typography, an outlined ghost wordmark, and paper grain.
 *
 * Deliberately zero canvas / WebGL / rAF: it's markup + CSS, so it is
 * pixel-crisp at any DPI, costs nothing to render, and never competes with
 * the signature or the hanging ID card.
 */
export function HeroStage() {
  return (
    <div className="stage" aria-hidden>
      {/* 12-column layout grid */}
      <div className="stage__grid">
        {Array.from({ length: COLUMNS }).map((_, i) => (
          <span
            key={i}
            className="stage__col"
            style={{ ["--i" as string]: i }}
          />
        ))}
      </div>

      {/* Trim margin + printer's crop marks */}
      <span className="stage__trim" />
      {CORNERS.map((c) => (
        <span key={c} className={`stage__crop stage__crop--${c}`} />
      ))}

      {/* Registration target */}
      <span className="stage__reg">
        <span className="stage__reg-ring" />
        <span className="stage__reg-cross" />
      </span>

      {/* Margin micro-typography */}
      <span className="stage__folio stage__folio--tr">Plate 01 / 04</span>
      <span className="stage__folio stage__folio--br">
        CMYK · 300dpi · Trim 1240
      </span>
      <span className="stage__edge">Portfolio — MMXXVI</span>

      {/* Outlined ghost wordmark, bleeding off the left trim */}
      <span className="stage__ghost">{SITE.name.toUpperCase()}</span>

      {/* Paper grain */}
      <span className="stage__grain" />
    </div>
  );
}
