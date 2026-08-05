"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HeroToolbar, type ToolId } from "@/features/home/components/hero-toolbar";
import { HeroLayersPanel, LAYERS, type LayerId } from "@/features/home/components/hero-layers";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { WORK_ITEMS } from "@/lib/work";
import { cn } from "@/lib/cn";

/* ================================================================== *
 * Studio document — Photoshop-themed poster composite.
 *
 * Sits after Letter Craft. Layers land one-by-one on the artboard
 * (scroll-armed), then the real tools stay live for exploration.
 * ================================================================== */

/** Two plates: the composite you land on, and what's hiding under it. */
function plates() {
  const unique: string[] = [];
  for (const item of WORK_ITEMS) {
    if (!unique.includes(item.src)) unique.push(item.src);
    if (unique.length >= 2) break;
  }
  return { top: unique[0], under: unique[1] ?? unique[0] };
}

/** Layer land cadence — slow enough to read each step. */
const BUILD_STEP_MS = 340;
const BRUSH_RADIUS = 46;
const ZOOM_STEPS = [60, 80, 100, 130, 170, 220];

type Rect = { x: number; y: number; w: number; h: number };

function toHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function StudioDocument() {
  const reduced = useReducedMotion();
  const { top: TOP_PLATE, under: UNDER_PLATE } = plates();

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const underImgRef = useRef<HTMLImageElement | null>(null);
  const sampleRef = useRef<HTMLCanvasElement | null>(null);

  const [armed, setArmed] = useState(false);
  const [tool, setTool] = useState<ToolId>("move");
  const [built, setBuilt] = useState(0);
  const [hidden, setHidden] = useState<Set<LayerId>>(new Set());
  const [selection, setSelection] = useState<Rect | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoomIdx, setZoomIdx] = useState(2);
  const [picked, setPicked] = useState<string | null>(null);
  const [painting, setPainting] = useState(false);

  const zoom = ZOOM_STEPS[zoomIdx];

  /* Arm the build when the document enters view (not on page load). */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setArmed(true);
      },
      { threshold: 0.22 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* Act A: land layers bottom-up once armed. */
  useEffect(() => {
    if (reduced || !armed) return;
    if (built >= LAYERS.length) return;
    const id = window.setTimeout(
      () => setBuilt((n) => n + 1),
      built === 0 ? 280 : BUILD_STEP_MS,
    );
    return () => window.clearTimeout(id);
  }, [armed, built, reduced]);

  const shown = reduced ? LAYERS.length : built;
  const done = shown >= LAYERS.length;

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
      if (e.key === "Escape") {
        setSelection(null);
        clearBrush();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearBrush]);

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

  const dab = useCallback((x: number, y: number, w: number, h: number) => {
    const ctx = canvasRef.current?.getContext("2d");
    const img = underImgRef.current;
    if (!ctx || !img) return;
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

  const drag = useRef<{ x: number; y: number; pan: { x: number; y: number } } | null>(
    null,
  );

  const onDown = (e: React.PointerEvent) => {
    if (!done) return;
    const p = local(e);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* no capture */
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
    setSelection((s) => (s && (s.w < 4 || s.h < 4) ? null : s));
  };

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
      ref={sectionRef}
      className={cn("psh", done && "is-done", `psh--${tool}`)}
      aria-labelledby="studio-doc-title"
      id="studio-document"
    >
      <h2 id="studio-doc-title" className="sr-only">
        Poster composite — layers build one by one
      </h2>

      <div className="psh__titlebar" aria-hidden>
        <span className="psh__doc">
          poster-composite.psd
          <em>@ {zoom}%</em>
          <em>RGB/8</em>
          {!done ? <em className="psh__building">Building…</em> : null}
        </span>
        <span className="psh__hint">
          {done ? (
            <>
              Pick a tool — <kbd>V</kbd> <kbd>M</kbd> <kbd>I</kbd> <kbd>B</kbd>{" "}
              <kbd>H</kbd> <kbd>Z</kbd>
            </>
          ) : (
            <>Layers placing — watch the stack</>
          )}
        </span>
      </div>

      <HeroToolbar tool={tool} onPick={setTool} disabled={!done} />

      <HeroLayersPanel
        built={shown}
        hidden={hidden}
        onToggle={toggleLayer}
        disabled={!done}
      />

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

          <span className={layerCls("wash")} aria-hidden />
          <span
            className={layerCls("plate")}
            aria-hidden
            style={{ backgroundImage: `url("${TOP_PLATE}")` }}
          />
          <span className={layerCls("grain")} aria-hidden />
          <span className={layerCls("duotone")} aria-hidden />

          <canvas
            ref={canvasRef}
            className={cn("psh__paint", visible("plate") && "is-live")}
            aria-hidden
          />

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

          {/* Title lockup — finishes the poster, not a brand billboard */}
          <div className={cn(layerCls("type"), "psh__lockup")} aria-hidden>
            <span className="psh__lockup-num">01</span>
            <span className="psh__lockup-title">Poster</span>
            <span className="psh__lockup-rule" />
            <span className="psh__lockup-meta">Artwork · Grade · Type</span>
          </div>
        </div>
      </div>

      <div className="psh__status" aria-hidden>
        <span>
          {done
            ? `${LAYERS.length} layers · composite complete`
            : armed
              ? `Placing ${shown}/${LAYERS.length}…`
              : "Scroll to build"}
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
