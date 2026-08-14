"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { type WorkCategoryId } from "@/lib/work";
import { useWorkCategories, useWorkItems } from "@/lib/cms/hooks";

const VIDEO = "/abhi.mp4";
const FRAME_MANIFEST = "/film-frames/manifest.json";
/**
 * Seconds dropped off the end on the video-seek fallback path. The current
 * film resolves back to its opening wide shot, so there is nothing to cut —
 * keep this in step with `--trim` in scripts/extract-film-frames.mjs.
 */
const TAIL_TRIM = 0;
const MIN_FRAMES = 250;
const MOBILE_FRAMES = 160;
const ASSUMED_FPS = 24;
const REVEAL_AT = 0.985;
const PX_PER_FRAME = 12;
const PX_PER_FRAME_MOBILE = 9;
/** Smoothstep anticipation across the last portion of scrub. */
const END_EASE = 0.08;
/** White hold after splash hit before panels spawn. */
const PANEL_HOLD_MS = 120;
/** How far ahead of the playhead we keep warm (Lenis can jump several frames/tick). */
const PREFETCH_AHEAD = 36;
const PREFETCH_BEHIND = 12;
/** Parallel HTTP + decode workers for the still cache. */
const PREFETCH_CONCURRENCY = 10;

type FrameManifest = {
  count: number;
  pattern: string; // e.g. "/film-frames/frame-{i}.webp"
  pad: number;
  /** 1 when files are ffmpeg-style frame-001…; 0 when zero-based. */
  indexBase?: number;
};

const PANEL_FEATURE: Record<
  string,
  { tag: string; glyph: string; className: string }
> = {
  posters: { tag: "Impact type", glyph: "P", className: "quad--fx-poster" },
  thumbnails: { tag: "Scroll-stop", glyph: "▶", className: "quad--fx-thumb" },
  logos: { tag: "Identity mark", glyph: "◇", className: "quad--fx-logo" },
  books: { tag: "Editorial", glyph: "≡", className: "quad--fx-book" },
};

type WorkFilmProps = {
  onSelectCategory?: (id: WorkCategoryId) => void;
  /** full = scrub film; splash = short splash then panels (deep-links). */
  intro?: "full" | "splash";
};

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** Map raw scroll p through end anticipation into eased progress. */
function easeScrub(p: number) {
  if (p < 1 - END_EASE) {
    return p / (1 - END_EASE) * (1 - END_EASE);
  }
  const local = (p - (1 - END_EASE)) / END_EASE;
  return 1 - END_EASE + END_EASE * smoothstep(local);
}

function frameUrl(manifest: FrameManifest, index: number) {
  const base = manifest.indexBase ?? 0;
  const n = String(index + base).padStart(manifest.pad, "0");
  return manifest.pattern.replace("{i}", n);
}

/**
 * /work opening — silent frame scrub (video or cached stills). End: 3-beat
 * splash, hold, then four signature panels with product-depth hover.
 */
export function WorkFilm({
  onSelectCategory,
  intro = "full",
}: WorkFilmProps) {
  const categories = useWorkCategories();
  const workItems = useWorkItems();
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const seeking = useRef(false);
  const pendingTime = useRef<number | null>(null);
  const lastFrame = useRef(-1);
  const paintedFrame = useRef(-1);
  const scrollDir = useRef(1);
  const readyRef = useRef(false);
  const usableRef = useRef(0);
  const frameCountRef = useRef(MIN_FRAMES);
  const wasRevealed = useRef(false);
  const manifestRef = useRef<FrameManifest | null>(null);
  /** Decoded video-fallback bitmaps (small sliding set). */
  const bitmapCache = useRef(new Map<number, ImageBitmap>());
  /** Prefetched stills — browser holds the bytes; we draw when `complete`. */
  const stillCache = useRef(new Map<number, HTMLImageElement>());
  const prefetchQueue = useRef<number[]>([]);
  const prefetchActive = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const [revealed, setRevealed] = useState(intro === "splash");
  const [panelsReady, setPanelsReady] = useState(false);
  const [ready, setReady] = useState(intro === "splash");
  const [frameCount, setFrameCount] = useState(MIN_FRAMES);
  const [splashKey, setSplashKey] = useState(0);
  const [useFrames, setUseFrames] = useState(false);
  const [flipIndex, setFlipIndex] = useState<Record<string, number>>({});
  // Desktop default matches SSR so --film-px never hydrates mismatched.
  const [pxPer, setPxPer] = useState(PX_PER_FRAME);
  /** Phones: skip frame scrub — panels only. */
  const [mobilePanels, setMobilePanels] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const sync = () => setMobilePanels(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const paintSource = useCallback(
    (source: CanvasImageSource, width: number, height: number) => {
      const canvas = canvasRef.current;
      if (!canvas || width < 1 || height < 1) return;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        ctxRef.current = null;
      }
      const ctx =
        ctxRef.current ?? canvas.getContext("2d", { alpha: false });
      if (!ctx) return;
      ctxRef.current = ctx;
      ctx.drawImage(source, 0, 0, width, height);
      canvas.classList.add("is-lit");
    },
    [],
  );

  const paintBitmap = useCallback(
    (bitmap: ImageBitmap) => {
      paintSource(bitmap, bitmap.width, bitmap.height);
    },
    [paintSource],
  );

  const paintStill = useCallback(
    (img: HTMLImageElement) => {
      paintSource(img, img.naturalWidth, img.naturalHeight);
    },
    [paintSource],
  );

  const isStillReady = useCallback((index: number) => {
    const img = stillCache.current.get(index);
    return !!(img && img.complete && img.naturalWidth > 0);
  }, []);

  /** Always paint something — target if ready, else the nearest decoded neighbour. */
  const paintNearestStill = useCallback(
    (target: number) => {
      const count = manifestRef.current?.count ?? 0;
      if (count < 1) return false;

      if (isStillReady(target)) {
        paintStill(stillCache.current.get(target)!);
        paintedFrame.current = target;
        return true;
      }

      for (let d = 1; d < count; d += 1) {
        const hi = target + d;
        const lo = target - d;
        if (hi < count && isStillReady(hi)) {
          paintStill(stillCache.current.get(hi)!);
          paintedFrame.current = hi;
          return true;
        }
        if (lo >= 0 && isStillReady(lo)) {
          paintStill(stillCache.current.get(lo)!);
          paintedFrame.current = lo;
          return true;
        }
      }
      return false;
    },
    [isStillReady, paintStill],
  );

  const drainPrefetch = useCallback(() => {
    const manifest = manifestRef.current;
    if (!manifest) return;

    while (
      prefetchActive.current < PREFETCH_CONCURRENCY &&
      prefetchQueue.current.length > 0
    ) {
      const index = prefetchQueue.current.shift();
      if (typeof index !== "number") break;
      if (index < 0 || index >= manifest.count) continue;

      const existing = stillCache.current.get(index);
      if (existing) {
        // Already decoded, or still in flight — leave it alone.
        if (existing.naturalWidth > 0) continue;
        if (!existing.complete && existing.src) continue;
        stillCache.current.delete(index);
      }

      const img = new Image();
      img.decoding = "async";
      // Keep the playhead window ahead of the background warm in the network queue.
      if (Math.abs(index - (lastFrame.current < 0 ? 0 : lastFrame.current)) <= 8) {
        img.fetchPriority = "high";
      }
      stillCache.current.set(index, img);
      prefetchActive.current += 1;

      const settle = () => {
        prefetchActive.current = Math.max(0, prefetchActive.current - 1);
        // Re-pick the closest ready still — a neighbour that just landed may
        // beat whatever we were holding from further away.
        const target = lastFrame.current < 0 ? 0 : lastFrame.current;
        if (
          paintedFrame.current !== target ||
          Math.abs(index - target) <= Math.abs(paintedFrame.current - target)
        ) {
          paintNearestStill(target);
        }
        drainPrefetch();
      };

      img.onload = () => {
        // decode() moves raster work off the critical path when supported.
        if (typeof img.decode === "function") {
          void img.decode().then(settle).catch(settle);
        } else {
          settle();
        }
      };
      img.onerror = settle;
      img.src = frameUrl(manifest, index);
    }
  }, [paintNearestStill]);

  const queuePrefetch = useCallback(
    (center: number, dir: number) => {
      const manifest = manifestRef.current;
      if (!manifest) return;
      const count = manifest.count;
      const order: number[] = [];
      const seen = new Set<number>();
      const push = (i: number) => {
        if (i < 0 || i >= count || seen.has(i)) return;
        seen.add(i);
        order.push(i);
      };

      push(center);
      for (let i = 1; i <= PREFETCH_AHEAD; i += 1) push(center + dir * i);
      for (let i = 1; i <= PREFETCH_BEHIND; i += 1) push(center - dir * i);
      // Warm the rest so a fast Lenis flick never outruns the cache.
      for (let i = 0; i < count; i += 1) push(i);

      prefetchQueue.current = order.filter((i) => {
        const img = stillCache.current.get(i);
        if (!img) return true;
        // Retry a hard failure; leave in-flight loads alone.
        return img.complete && img.naturalWidth === 0;
      });
      drainPrefetch();
    },
    [drainPrefetch],
  );

  const showFrame = useCallback(
    (index: number) => {
      if (!manifestRef.current) return;
      paintNearestStill(index);
      // Ensure the exact target is first in the queue, then the window around it.
      queuePrefetch(index, scrollDir.current);
    },
    [paintNearestStill, queuePrefetch],
  );

  const cacheVideoFrame = useCallback(
    async (frameIndex: number) => {
      const v = videoRef.current;
      if (!v || bitmapCache.current.has(frameIndex)) {
        const hit = bitmapCache.current.get(frameIndex);
        if (hit) paintBitmap(hit);
        return;
      }
      try {
        const bmp = await createImageBitmap(v);
        bitmapCache.current.set(frameIndex, bmp);
        if (bitmapCache.current.size > 64) {
          const first = bitmapCache.current.keys().next().value;
          if (typeof first === "number") {
            bitmapCache.current.get(first)?.close();
            bitmapCache.current.delete(first);
          }
        }
        paintBitmap(bmp);
      } catch {
        /* ignore */
      }
    },
    [paintBitmap],
  );

  const requestSeek = useCallback(
    (t: number, frameIndex?: number) => {
      if (manifestRef.current) return;
      const v = videoRef.current;
      if (!v) return;
      if (seeking.current) {
        pendingTime.current = t;
        return;
      }
      seeking.current = true;
      try {
        v.currentTime = t;
        if (typeof frameIndex === "number") {
          const onSeekedOnce = () => {
            v.removeEventListener("seeked", onSeekedOnce);
            void cacheVideoFrame(frameIndex);
          };
          v.addEventListener("seeked", onSeekedOnce);
        }
      } catch {
        seeking.current = false;
      }
    },
    [cacheVideoFrame],
  );

  useEffect(() => {
    const sync = () => {
      setPxPer(window.innerWidth < 720 ? PX_PER_FRAME_MOBILE : PX_PER_FRAME);
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  // Prefer cached stills when manifest exists.
  useEffect(() => {
    if (intro === "splash" || mobilePanels) return;
    let cancelled = false;
    fetch(FRAME_MANIFEST)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: FrameManifest | null) => {
        if (cancelled || !data?.count || !data.pattern) return;
        manifestRef.current = data;
        frameCountRef.current = data.count;
        usableRef.current = 1;
        readyRef.current = true;
        lastFrame.current = 0;
        setFrameCount(data.count);
        setUseFrames(true);
        setReady(true);
        // Kick the warm window immediately — first paint lands as soon as
        // frame 0 decodes, then the rest fill in behind the playhead.
        queuePrefetch(0, 1);
      })
      .catch(() => {
        /* fall through to video */
      });
    return () => {
      cancelled = true;
      prefetchQueue.current = [];
      stillCache.current.clear();
    };
  }, [intro, mobilePanels, queuePrefetch]);

  // Canvas mounts with useFrames — paint whatever is ready (frame 0 first).
  useEffect(() => {
    if (!useFrames) return;
    showFrame(lastFrame.current < 0 ? 0 : lastFrame.current);
  }, [useFrames, showFrame]);

  useEffect(() => {
    if (intro === "splash" || mobilePanels || useFrames) return;
    const v = videoRef.current;
    if (!v) return;

    const onSeeked = () => {
      seeking.current = false;
      if (pendingTime.current !== null) {
        const t = pendingTime.current;
        pendingTime.current = null;
        requestSeek(t);
      }
    };

    const arm = () => {
      const d = v.duration;
      if (!Number.isFinite(d) || d <= TAIL_TRIM) return;
      const usable = d - TAIL_TRIM;
      const mobile = window.innerWidth < 720;
      const min = mobile ? MOBILE_FRAMES : MIN_FRAMES;
      const count = Math.max(min, Math.ceil(usable * ASSUMED_FPS));
      usableRef.current = usable;
      frameCountRef.current = count;
      readyRef.current = true;
      setFrameCount(count);
      setReady(true);
      try {
        v.currentTime = 1 / ASSUMED_FPS;
      } catch {
        /* ignore */
      }
    };

    v.addEventListener("seeked", onSeeked);
    v.addEventListener("loadedmetadata", arm);
    v.addEventListener("canplaythrough", arm, { once: true });
    if (v.readyState >= 1) arm();

    return () => {
      v.removeEventListener("seeked", onSeeked);
      v.removeEventListener("loadedmetadata", arm);
    };
  }, [intro, mobilePanels, useFrames, requestSeek]);

  // Splash / mobile: skip scrub — short splash then discipline panels.
  useEffect(() => {
    if (intro !== "splash" && !mobilePanels) return;
    setSplashKey((k) => k + 1);
    setRevealed(true);
    setReady(true);
    const id = window.setTimeout(() => setPanelsReady(true), PANEL_HOLD_MS + 80);
    return () => window.clearTimeout(id);
  }, [intro, mobilePanels]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !ready || intro === "splash" || mobilePanels) return;

    let ticking = false;

    const update = () => {
      ticking = false;
      const rect = track.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      if (span <= 0) return;
      const raw = Math.min(1, Math.max(0, -rect.top / span));
      const p = easeScrub(raw);

      const count = frameCountRef.current;
      const usable = usableRef.current;
      if (count > 1 && usable > 0) {
        const frameIndex = Math.round(p * (count - 1));
        if (frameIndex !== lastFrame.current) {
          scrollDir.current = frameIndex >= lastFrame.current ? 1 : -1;
          lastFrame.current = frameIndex;
          if (manifestRef.current) {
            showFrame(Math.min(frameIndex, manifestRef.current.count - 1));
          } else {
            const cached = bitmapCache.current.get(frameIndex);
            if (cached) {
              paintBitmap(cached);
            } else {
              const t = (frameIndex / (count - 1)) * usable;
              const q = Math.round(t * ASSUMED_FPS) / ASSUMED_FPS;
              requestSeek(Math.min(usable, Math.max(0, q)), frameIndex);
            }
          }
        }
      }

      const nowRevealed = raw >= REVEAL_AT;
      setRevealed((r) => {
        if (nowRevealed) return true;
        if (r && raw < REVEAL_AT - 0.03) return false;
        return r;
      });

      if (nowRevealed && !wasRevealed.current) {
        wasRevealed.current = true;
        setSplashKey((k) => k + 1);
        setPanelsReady(false);
        window.setTimeout(() => setPanelsReady(true), PANEL_HOLD_MS);
      } else if (!nowRevealed && raw < REVEAL_AT - 0.03) {
        wasRevealed.current = false;
        setPanelsReady(false);
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [requestSeek, ready, intro, mobilePanels, showFrame, paintBitmap]);

  // Pause infinite FX when tab hidden.
  useEffect(() => {
    const onVis = () => {
      document.documentElement.classList.toggle(
        "film-paused",
        document.visibilityState !== "visible",
      );
    };
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const skipToPanels = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const span = rect.height - window.innerHeight;
    if (span <= 0) return;
    const top = window.scrollY + rect.top + span * REVEAL_AT;
    window.__lenis?.scrollTo(top, { immediate: false });
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  const onPanelMove = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      // Tilt is a fine-pointer flourish — coarse touch just needs a clean tap.
      if (!window.matchMedia("(pointer: fine)").matches) return;
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      btn.style.setProperty("--tilt-x", `${(-y * 6).toFixed(2)}deg`);
      btn.style.setProperty("--tilt-y", `${(x * 7).toFixed(2)}deg`);
      btn.style.setProperty("--par-x", `${(x * 10).toFixed(2)}px`);
      btn.style.setProperty("--par-y", `${(y * 10).toFixed(2)}px`);
    },
    [],
  );

  const onPanelLeave = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    btn.style.setProperty("--tilt-x", "0deg");
    btn.style.setProperty("--tilt-y", "0deg");
    btn.style.setProperty("--par-x", "0px");
    btn.style.setProperty("--par-y", "0px");
  }, []);

  // Thumbnail flipbook on hover — desktop only.
  useEffect(() => {
    if (!panelsReady) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }
    const timers: number[] = [];
    for (const cat of categories) {
      if (cat.id !== "thumbnails") continue;
      const items = workItems.filter((i) => i.category === cat.id).slice(0, 4);
      if (items.length < 2) continue;
      let i = 0;
      const id = window.setInterval(() => {
        const el = document.querySelector(
          `.quad--fx-thumb:hover .quad__art`,
        );
        if (!el) return;
        i = (i + 1) % items.length;
        setFlipIndex((prev) => ({ ...prev, thumbnails: i }));
      }, 420);
      timers.push(id);
    }
    return () => timers.forEach((t) => window.clearInterval(t));
  }, [panelsReady, categories, workItems]);

  const activate = useCallback(
    (id: WorkCategoryId, btn: HTMLButtonElement) => {
      const go = () => {
        onSelectCategory?.(id);
        router.push(`/work/${id}`, { scroll: false });
      };

      const media = btn.querySelector(".quad__art") as HTMLElement | null;
      if (media) {
        media.style.viewTransitionName = `work-panel-${id}`;
      }

      const doc = document as Document & {
        startViewTransition?: (cb: () => void) => { finished: Promise<void> };
      };

      if (doc.startViewTransition) {
        const vt = doc.startViewTransition(() => {
          go();
        });
        vt.finished.finally(() => {
          if (media) media.style.viewTransitionName = "";
        });
      } else {
        go();
        if (media) media.style.viewTransitionName = "";
      }
    },
    [onSelectCategory, router],
  );

  // Keyboard launcher once panels are ready.
  useEffect(() => {
    if (!panelsReady) return;
    const onKey = (e: KeyboardEvent) => {
      const buttons = Array.from(
        document.querySelectorAll<HTMLButtonElement>(".film__quads .quad__btn"),
      );
      if (!buttons.length) return;
      const active = document.activeElement as HTMLElement | null;
      let idx = buttons.findIndex((b) => b === active);
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        idx = idx < 0 ? 0 : (idx + 1) % buttons.length;
        buttons[idx]?.focus();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        idx = idx < 0 ? 0 : (idx - 1 + buttons.length) % buttons.length;
        buttons[idx]?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelsReady]);

  return (
    <div
      ref={trackRef}
      className={cn(
        "film",
        revealed && "is-revealed",
        panelsReady && "is-panels",
        (intro === "splash" || mobilePanels) && "film--splash-only",
        mobilePanels && "film--mobile-panels",
      )}
      style={
        {
          ["--film-frames" as string]:
            intro === "splash" || mobilePanels ? 1 : frameCount,
          ["--film-px" as string]:
            intro === "splash" || mobilePanels ? "0px" : `${pxPer}px`,
        } as CSSProperties
      }
      aria-label="Selected work film"
    >
      <p className="sr-only" aria-live="polite">
        {revealed
          ? "Work disciplines ready. Choose a panel."
          : "Playing work film. Scroll to continue."}
      </p>

      <div className="film__stage">
        {!mobilePanels && useFrames ? (
          <canvas
            ref={canvasRef}
            className="film__video film__video--canvas film__video--frames"
            aria-hidden
          />
        ) : null}
        {!mobilePanels && !useFrames ? (
          <>
            <video
              ref={videoRef}
              className="film__video"
              src={VIDEO}
              muted
              playsInline
              preload="auto"
              disablePictureInPicture
              aria-hidden
            />
            <canvas
              ref={canvasRef}
              className="film__video film__video--canvas"
              aria-hidden
            />
          </>
        ) : null}
        {!mobilePanels ? (
          <>
            <span className="film__grain" aria-hidden />
            <span className="film__vignette" aria-hidden />
          </>
        ) : null}

        {!revealed && ready && intro === "full" && !mobilePanels ? (
          <button
            type="button"
            className="film__skip"
            onClick={skipToPanels}
          >
            Skip to disciplines
          </button>
        ) : null}

        {revealed ? (
          <div
            key={`splash-${splashKey}`}
            className="film__splash"
            aria-hidden
          >
            {/* Beat 1 — Hit */}
            <span className="film__flash film__beat-hit" />
            <span className="film__core film__beat-hit" />
            {/* Beat 2 — Expand */}
            <span className="film__bloom film__beat-expand" />
            <span className="film__ring film__ring--a film__beat-expand" />
            <span className="film__ring film__ring--b film__beat-expand" />
            <span className="film__ring film__ring--c film__beat-expand" />
            <span className="film__rays film__beat-expand" />
            <span className="film__shock film__beat-expand" />
            {/* Beat 3 — Resolve */}
            <span className="film__shards film__beat-resolve">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="film__chroma film__beat-resolve" />
          </div>
        ) : null}

        <ul
          className={cn("film__quads", panelsReady && "is-live")}
          aria-label="Work disciplines"
        >
          {categories.map((cat, i) => {
            const fx = PANEL_FEATURE[cat.id] ?? {
              tag: cat.short,
              glyph: cat.short.slice(0, 1),
              className: "quad--fx-poster",
            };
            const items = workItems.filter((it) => it.category === cat.id);
            const featured = items[0];
            const flip =
              cat.id === "thumbnails"
                ? items[flipIndex.thumbnails ?? 0] ?? featured
                : featured;
            const artSrc = flip?.src;

            return (
              <li
                key={cat.id}
                className={cn("quad", `quad--${cat.slot}`, fx.className)}
                style={{ ["--i" as string]: i }}
              >
                <button
                  type="button"
                  className="quad__btn"
                  onClick={(e) => activate(cat.id, e.currentTarget)}
                  onPointerMove={onPanelMove}
                  onPointerLeave={onPanelLeave}
                  tabIndex={panelsReady ? 0 : -1}
                >
                  <span className="quad__media" aria-hidden>
                    <span
                      className={cn("quad__art", `quad__art--${cat.id}`)}
                      style={
                        artSrc
                          ? {
                              backgroundImage: `linear-gradient(165deg, rgba(11, 31, 77, 0.62), rgba(5, 8, 15, 0.9)), url("${artSrc}")`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }
                          : undefined
                      }
                    />
                    <span className="quad__sheen" />
                    <span className="quad__fx" aria-hidden>
                      <span className="quad__fx-glyph">{fx.glyph}</span>
                      <span className="quad__fx-orbit" />
                      <span className="quad__fx-strip" />
                      <span className="quad__fx-pages" />
                    </span>
                  </span>
                  <span className="quad__body">
                    <span className="quad__tag">{fx.tag}</span>
                    <span className="quad__no" aria-hidden>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="quad__label">{cat.short}</span>
                    <span className="quad__sub">{cat.blurb}</span>
                    {featured ? (
                      <span className="quad__featured">{featured.title}</span>
                    ) : null}
                    <span className="quad__meta">
                      <span className="quad__count">
                        {items.length} {items.length === 1 ? "piece" : "pieces"}
                      </span>
                      <span className="quad__go" aria-hidden>
                        Enter ↗
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {panelsReady ? (
          <p className="film__cue" aria-hidden>
            Choose a discipline
          </p>
        ) : null}
      </div>
    </div>
  );
}
