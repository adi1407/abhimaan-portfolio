"use client";

import { useMemo, useState } from "react";
import { GravityGallery } from "@/components/motion/gravity-gallery";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { TOOLS, type Tool } from "@/lib/about";
import { useAbout } from "@/lib/cms/hooks";

/** Rasterless brand tile — glyph on vendor palette, no trademarked logos. */
function toolTileSrc(tool: Tool, size = 256): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="28" fill="${tool.bg}"/>
    <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle"
      font-family="system-ui,Segoe UI,sans-serif" font-weight="700"
      font-size="${Math.round(size * 0.38)}" fill="${tool.fg}">${tool.short}</text>
    <text x="50%" y="82%" text-anchor="middle" dominant-baseline="middle"
      font-family="system-ui,Segoe UI,sans-serif" font-weight="500"
      font-size="${Math.round(size * 0.07)}" letter-spacing="0.18em"
      fill="${tool.fg}" opacity="0.55">${tool.serial}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function AboutToolkit() {
  const about = useAbout<{ tools?: Tool[] }>();
  const tools = about.tools?.length ? about.tools : TOOLS;
  const [active, setActive] = useState<string | null>(null);
  const reduced = useReducedMotion();

  const current = tools.find((t) => t.id === active) ?? null;

  const images = useMemo(
    () =>
      tools.map((tool) => ({
        src: toolTileSrc(tool),
        alt: tool.name,
      })),
    [tools],
  );

  /** Cycle tools so the tray feels full; still maps 1:1 to skill readout. */
  const bodyCount = Math.min(16, Math.max(8, tools.length * 3));

  return (
    <section className="tk" aria-labelledby="tk-title">
      <div className="tk__head">
        <p className="tk__eyebrow">
          <span className="tk__tick" aria-hidden />
          Instruments / 04
        </p>
        <h2 id="tk-title" className="tk__title">
          My toolkit
        </h2>
        <p className="tk__hint">
          {reduced
            ? "Tap a tool below to see what it powers."
            : "Drag the tiles, knock them around — then pick a tool from the list."}
        </p>
      </div>

      <div className="tk__tray tk__tray--gravity is-live">
        <span className="tk__tray-rule" aria-hidden />
        <GravityGallery
          className="tk__gravity"
          images={images}
          count={bodyCount}
          size={110}
          shape="square"
          friction={1.4}
          mouseEnable={!reduced}
          gravY={1}
          wallOptions={{ top: true, bottom: true, left: true, right: true }}
        />
      </div>

      <div className="tk__pick" role="group" aria-label="Select a tool">
        {tools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={
              active === tool.id ? "tk__chip is-on" : "tk__chip"
            }
            style={
              {
                "--bg": tool.bg,
                "--fg": tool.fg,
              } as React.CSSProperties
            }
            aria-pressed={active === tool.id}
            onClick={() =>
              setActive((cur) => (cur === tool.id ? null : tool.id))
            }
          >
            <span className="tk__chip-glyph">{tool.short}</span>
            <span className="tk__chip-name">{tool.name}</span>
          </button>
        ))}
      </div>

      <div className="tk__readout">
        <p className="tk__readout-name">{current ? current.name : "Toolkit"}</p>
        <ul className="tk__readout-list">
          {(current ? current.skills : tools.flatMap((t) => t.skills)).map(
            (skill, i) => (
              <li key={skill} style={{ ["--i" as string]: i }}>
                {skill}
              </li>
            ),
          )}
        </ul>
      </div>
    </section>
  );
}
