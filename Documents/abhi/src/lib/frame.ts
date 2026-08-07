/* ================================================================== *
 * Shared frame loop
 *
 * The site had ~26 independent requestAnimationFrame loops and 10
 * separate window scroll listeners. Each scroll listener did its own
 * getBoundingClientRect, so a single scroll event forced layout over
 * and over — the classic thrash that shows up as jank on a phone.
 *
 * Everything here shares one rAF. Subscribers get the timestamp and a
 * clamped delta; viewport subscribers additionally get scroll/size
 * measured ONCE per frame and handed to everyone.
 *
 * The loop only exists while something is listening — no subscribers
 * means no rAF, so an idle page costs nothing.
 * ================================================================== */

export type FrameInfo = {
  /** performance.now() for this frame. */
  now: number;
  /** Seconds since the previous frame, clamped so a backgrounded tab
   *  cannot resume with a huge jump. */
  dt: number;
};

export type ViewportInfo = FrameInfo & {
  scrollY: number;
  vh: number;
  vw: number;
};

type FrameFn = (f: FrameInfo) => void;
type ViewportFn = (v: ViewportInfo) => void;

const frameSubs = new Set<FrameFn>();
const viewportSubs = new Set<ViewportFn>();

let raf = 0;
let last = 0;
/** Set when scroll/resize fired, so we only re-measure when needed. */
let dirty = true;
let scrollY = 0;
let vh = 0;
let vw = 0;

function measure() {
  scrollY = window.scrollY;
  vh = window.innerHeight;
  vw = window.innerWidth;
  dirty = false;
}

function tick(now: number) {
  const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
  last = now;

  if (viewportSubs.size > 0) {
    // One measurement per frame, shared by every subscriber, instead of
    // each of them calling into layout independently.
    if (dirty) measure();
    const info: ViewportInfo = { now, dt, scrollY, vh, vw };
    for (const fn of viewportSubs) fn(info);
  }

  if (frameSubs.size > 0) {
    const info: FrameInfo = { now, dt };
    for (const fn of frameSubs) fn(info);
  }

  if (frameSubs.size === 0 && viewportSubs.size === 0) {
    raf = 0;
    last = 0;
    return;
  }
  raf = requestAnimationFrame(tick);
}

function start() {
  if (raf || typeof window === "undefined") return;
  dirty = true;
  raf = requestAnimationFrame(tick);
}

function markDirty() {
  dirty = true;
  start();
}

let bound = false;
function bindOnce() {
  if (bound || typeof window === "undefined") return;
  bound = true;
  window.addEventListener("scroll", markDirty, { passive: true });
  window.addEventListener("resize", markDirty);
}

/** Run `fn` every animation frame. Returns an unsubscribe. */
export function onFrame(fn: FrameFn): () => void {
  frameSubs.add(fn);
  start();
  return () => {
    frameSubs.delete(fn);
  };
}

/**
 * Run `fn` every frame with scroll position and viewport size already
 * measured. Use this instead of a window scroll listener.
 */
export function onViewport(fn: ViewportFn): () => void {
  bindOnce();
  viewportSubs.add(fn);
  markDirty();
  return () => {
    viewportSubs.delete(fn);
  };
}
