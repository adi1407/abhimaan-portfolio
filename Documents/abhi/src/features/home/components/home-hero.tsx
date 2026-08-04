"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { RoleCycle } from "@/components/motion/role-cycle";
import { ScrambleText } from "@/components/motion/scramble-text";
import { HeroToolbar, type ToolId } from "@/features/home/components/hero-toolbar";
import { HeroLayersPanel, LAYERS, type LayerId } from "@/features/home/components/hero-layers";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ROUTES, SITE } from "@/lib/constants";
import { WORK_ITEMS } from "@/lib/work";
import { cn } from "@/lib/cn";

/* ================================================================== *
 * Home hero — a live Photoshop document.
 *
 * Two acts:
 *  A) On load the composite BUILDS itself — layers land bottom-up,
 *     each with its real blend mode, and the Layers panel ticks them
 *     on in sequence. Afterwards the eye toggles stay live.
 *  B) The toolbar is real. The selected tool changes what the pointer
 *     DOES on the artboard: marquee cuts a selection that reveals the
 *     alternate plate, the eyedropper samples the art and retints the
 *     whole site, the brush paints that plate back in, hand pans and
 *     zoom scales.
 * ================================================================== */

const ROLES = [
  "Graphic Designer",
  "Brand Identity Designer",
  "Visual Storyteller",
  "3D Artist",
  "Creative Director",
  "Motion Designer",
] as const;

/** Two plates: the composite you land on, and what's hiding under it. */
function plates() {
  const unique: string[] = [];
  for (const item of WORK_ITEMS) {
    if (!unique.includes(item.src)) unique.push(item.src);
    if (unique.length >= 2) break;
  }
  return { top: unique[0], under: unique[1] ?? unique[0] };
}

/** Layer land cadence for act A. */
const BUILD_STEP_MS = 260;
const BRUSH_RADIUS = 46;
const ZOOM_STEPS = [60, 80, 100, 130, 170, 220];

type Rect = { x: number; y: number; w: number; h: number };

function toHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function HomeHero() {
  const reduced = useReducedMotion();
  const { top: TOP_PLATE, under: UNDER_PLATE } = plates();

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const underImgRef = useRef<HTMLImageElement | null>(null);
  const sampleRef = useRef<HTMLCanvasElement | null>(null);

  const [tool, setTool] = useState<ToolId>("move");
  const [built, setBuilt] = useState(0);
  const [hidden, setHidden] = useState<Set<LayerId>>(new Set());
  const [selection, setSelection] = useState<Rect | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoomIdx, setZoomIdx] = useState(2);
  const [picked, setPicked] = useState<string | null>(null);
  const [painting, setPainting] = useState(false);

  const zoom = ZOOM_STEPS[zoomIdx];

  /* --- Act A: land the layers one at a time --------------------- */
  useEffect(() => {
    if (reduced) return;
    if (built >= LAYERS.length) return;
    const id = window.setTimeout(
      () => setBuilt((n) => n + 1),
      built === 0 ? 420 : BUILD_STEP_MS,
    );
    return () => window.clearTimeout(id);
  }, [built, reduced]);

  /* useReducedMotion resolves after first paint, so `built` always starts
     at 0. Deriving the shown count (rather than seeding state from
     `reduced`) means a reduced-motion visitor gets the finished composite
     instead of a document stuck permanently at zero layers. */
  const shown = reduced ? LAYERS.length : built;
  const done = shown >= LAYERS.length;

  /* --- Offscreen copy of the art, so the dropper can read pixels -- */
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = TOP_PLATE;
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext("2d")?.drawImage(img, 0, 0);
      sampleRef.current = c;
    };
    const under = new window.Image();
    under.src = UNDER_PLATE;
    under.onload = () => {
      underImgRef.current = under;
    };
  }, [TOP_PLATE, UNDER_PLATE]);

  const clearBrush = useCallback(() => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (c && ctx) ctx.clearRect(0, 0, c.width, c.height);
  }, []);

  /* --- Keyboard shortcuts, the real Photoshop letters ------------ */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const map: Record<string, ToolId> = {
        v: "move",
        m: "marquee",
        i: "dropper",
        b: "brush",
        h: "hand",
        z: "zoom",
      };
      const next = map[e.key.toLowerCase()];
      if (next) {
        setTool(next);
        return;
      }
      // Cmd-D deselect is taken by the browser; plain Escape is safer.
      if (e.key === "Escape") {
        setSelection(null);
        clearBrush();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearBrush]);

  /* --- Size the paint canvas to the stage ------------------------ */
  useEffect(() => {
    const stage = stageRef.current;
    const c = canvasRef.current;
    if (!stage || !c) return;
    const fit = () => {
      const r = stage.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.max(1, Math.round(r.width * dpr));
      c.height = Math.max(1, Math.round(r.height * dpr));
      c.style.width = `${r.width}px`;
      c.style.height = `${r.height}px`;
      const ctx = c.getContext("2d");
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  const local = (e: React.PointerEvent) => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
  };

  /* --- Brush: paint the hidden plate back in --------------------- */
  const dab = useCallback((x: number, y: number, w: number, h: number) => {
    const ctx = canvasRef.current?.getContext("2d");
    const img = underImgRef.current;
    if (!ctx || !img) return;
    // Cover-fit the plate to the stage, then clip the draw to the dab —
    // so a stroke exposes the layer beneath rather than smearing paint.
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, BRUSH_RADIUS, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    ctx.restore();
  }, []);

  /* --- Pointer routing: the tool decides what a drag means -------- */
  const drag = useRef<{ x: number; y: number; pan: { x: number; y: number } } | null>(
    null,
  );

  const onDown = (e: React.PointerEvent) => {
    if (!done) return;
    const p = local(e);
    // Capture is a nicety for drags that leave the stage; a pointer that
    // is already gone throws NotFoundError, which must not kill the tool.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* no capture available — the drag still tracks via pointermove */
    }

    if (tool === "marquee") {
      drag.current = { x: p.x, y: p.y, pan };
      setSelection({ x: p.x, y: p.y, w: 0, h: 0 });
    } else if (tool === "hand") {
      drag.current = { x: e.clientX, y: e.clientY, pan };
    } else if (tool === "brush") {
      setPainting(true);
      dab(p.x, p.y, p.w, p.h);
    } else if (tool === "dropper") {
      pick(p);
    } else if (tool === "zoom") {
      setZoomIdx((i) =>
        e.shiftKey || e.altKey
          ? Math.max(0, i - 1)
          : Math.min(ZOOM_STEPS.length - 1, i + 1),
      );
    }
  };

  const onMove = (e: React.PointerEvent) => {
    if (!done) return;
    const p = local(e);

    if (tool === "marquee" && drag.current) {
      const d = drag.current;
      setSelection({
        x: Math.min(d.x, p.x),
        y: Math.min(d.y, p.y),
        w: Math.abs(p.x - d.x),
        h: Math.abs(p.y - d.y),
      });
    } else if (tool === "hand" && drag.current) {
      const d = drag.current;
      setPan({
        x: d.pan.x + (e.clientX - d.x),
        y: d.pan.y + (e.clientY - d.y),
      });
    } else if (tool === "brush" && painting) {
      dab(p.x, p.y, p.w, p.h);
    }
  };

  const onUp = (e: React.PointerEvent) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId))
        e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    drag.current = null;
    setPainting(false);
    // A stray click with the marquee clears the selection instead of
    // leaving a zero-size marching-ants artefact on the canvas.
    setSelection((s) => (s && (s.w < 4 || s.h < 4) ? null : s));
  };

  /* --- Eyedropper: sample the art, retint the site --------------- */
  const pick = (p: { x: number; y: number; w: number; h: number }) => {
    const c = sampleRef.current;
    if (!c) return;
    const scale = Math.max(p.w / c.width, p.h / c.height);
    const dw = c.width * scale;
    const dh = c.height * scale;
    const sx = Math.round((p.x - (p.w - dw) / 2) / scale);
    const sy = Math.round((p.y - (p.h - dh) / 2) / scale);
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const px = ctx.getImageData(
      Math.max(0, Math.min(c.width - 1, sx)),
      Math.max(0, Math.min(c.height - 1, sy)),
      1,
      1,
    ).data;
    const hex = toHex(px[0], px[1], px[2]);
    setPicked(hex);
    document.documentElement.style.setProperty("--ps-accent", hex);
  };

  const toggleLayer = (id: LayerId) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const visible = (id: LayerId) => !hidden.has(id);
  const landed = (id: LayerId) => LAYERS.findIndex((l) => l.id === id) < shown;
  const layerCls = (id: LayerId) =>
    cn("psh__layer", `psh__layer--${id}`, landed(id) && "is-in", !visible(id) && "is-off");

  return (
    <section
      className={cn("psh", done && "is-done", `psh--${tool}`)}
      aria-labelledby="hero-brand"
    >
      {/* Document chrome */}
      <div className="psh__titlebar" aria-hidden>
        <span className="psh__doc">
          abhimaan-2026.psd
          <em>@ {zoom}%</em>
          <em>RGB/8</em>
        </span>
        <span className="psh__hint">
          Pick a tool — <kbd>V</kbd> <kbd>M</kbd> <kbd>I</kbd> <kbd>B</kbd>{" "}
          <kbd>H</kbd> <kbd>Z</kbd>
        </span>
      </div>

      <HeroToolbar tool={tool} onPick={setTool} disabled={!done} />

      <HeroLayersPanel
        built={shown}
        hidden={hidden}
        onToggle={toggleLayer}
        disabled={!done}
      />

      {/* The artboard */}
      <div className="psh__viewport">
        <div
          ref={stageRef}
          className="psh__stage"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom / 100})`,
          }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <span className="psh__checker" aria-hidden />

          {/* Layers, bottom-up — each lands in act A, each toggleable after */}
          <span className={layerCls("wash")} aria-hidden />
          <span
            className={layerCls("plate")}
            aria-hidden
            style={{ backgroundImage: `url("${TOP_PLATE}")` }}
          />
          <span className={layerCls("grain")} aria-hidden />
          <span className={layerCls("duotone")} aria-hidden />

          {/* Brush-revealed plate underneath */}
          <canvas
            ref={canvasRef}
            className={cn("psh__paint", visible("plate") && "is-live")}
            aria-hidden
          />

          {/* Marquee selection — the cut shows the alternate plate */}
          {selection && selection.w > 4 && selection.h > 4 ? (
            <span
              className="psh__marquee"
              aria-hidden
              style={{
                left: selection.x,
                top: selection.y,
                width: selection.w,
                height: selection.h,
              }}
            >
              <span
                className="psh__marquee-art"
                style={{
                  backgroundImage: `url("${UNDER_PLATE}")`,
                  backgroundPosition: `${-selection.x}px ${-selection.y}px`,
                }}
              />
            </span>
          ) : null}

          <span className={layerCls("curves")} aria-hidden />

          {/* Type layer */}
          <div className={cn(layerCls("type"), "psh__type")}>
            <p className="psh__eyebrow">
              <span className="psh__pulse" aria-hidden />
              <ScrambleText>ARTBOARD — 2026</ScrambleText>
            </p>

            <h1 id="hero-brand" className="psh__brand">
              <span className="psh__brand-text">{SITE.name.toUpperCase()}</span>
            </h1>

            <p className="psh__role-row">
              <span className="sr-only">{ROLES.join(", ")}</span>
              <RoleCycle roles={ROLES} className="psh__role" holdMs={2600} />
            </p>

            <p className="psh__lead">
              Layers, type &amp; motion systems — composed, never templated.
            </p>

            <div className="psh__cta">
              <Link href={ROUTES.work} className="psh__cta-primary">
                Enter the work
                <span aria-hidden>→</span>
              </Link>
              <Link href={ROUTES.contact} className="psh__cta-secondary">
                Start a brief
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="psh__status" aria-hidden>
        <span>
          {done ? `${LAYERS.length} layers` : `Compositing ${shown}/${LAYERS.length}…`}
        </span>
        {picked ? (
          <span className="psh__picked">
            <i style={{ background: picked }} />
            {picked.toUpperCase()} — site retinted
          </span>
        ) : (
          <span className="psh__picked psh__picked--idle">
            Eyedropper <kbd>I</kbd> retints the whole site
          </span>
        )}
        <button
          type="button"
          className="psh__reset"
          onClick={() => {
            setSelection(null);
            clearBrush();
            setPan({ x: 0, y: 0 });
            setZoomIdx(2);
            setHidden(new Set());
            setPicked(null);
            document.documentElement.style.removeProperty("--ps-accent");
          }}
        >
          Revert
        </button>
      </div>
    </section>
  );
}
