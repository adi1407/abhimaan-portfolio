/* ================================================================== *
 * Page scroll lock — reference counted.
 *
 * The book reader and the campaign grid each had their own copy of
 * lock/unlock. Both write `overflow: hidden` and both clear it to "",
 * so whichever overlay closed FIRST restored page scrolling while the
 * other was still open — the page then scrolled behind the overlay.
 * The mirror case is just as bad: a leftover lock leaves the whole
 * site unscrollable.
 *
 * Counting the holders fixes both: scrolling is restored exactly when
 * the last overlay lets go, and never before.
 *
 * While Lenis is stopped it preventDefaults every wheel/touch unless the
 * event target sits inside an element marked `data-lenis-prevent` (or the
 * horizontal/touch/wheel variants). Put that attribute on any overlay
 * scrollport — campaign grid, thumb strip, etc.
 * ================================================================== */

let holders = 0;
/** What the page had before we touched it, so we restore rather than blank. */
let prevHtml = "";
let prevBody = "";

export function lockPageScroll() {
  if (typeof document === "undefined") return;
  holders += 1;
  if (holders > 1) return;

  prevHtml = document.documentElement.style.overflow;
  prevBody = document.body.style.overflow;
  window.__lenis?.stop();
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
}

export function unlockPageScroll() {
  if (typeof document === "undefined") return;
  if (holders === 0) return;
  holders -= 1;
  if (holders > 0) return;

  document.documentElement.style.overflow = prevHtml;
  document.body.style.overflow = prevBody;
  window.__lenis?.start();
}

/** Escape hatch for teardown paths that must not leave the page stuck. */
export function forceReleaseScroll() {
  if (typeof document === "undefined") return;
  holders = 0;
  document.documentElement.style.overflow = prevHtml;
  document.body.style.overflow = prevBody;
  window.__lenis?.start();
}
