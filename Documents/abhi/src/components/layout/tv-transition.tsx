"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { useNav } from "@/components/layout/nav-provider";

/* ================================================================== *
 * TV transition — the About route is entered *through* a CRT.
 *
 * A small set sits centre-screen, clicks on, changes channel, and then
 * the camera pushes into the tube until the screen is all there is —
 * at which point the route has already swapped behind it and the glass
 * pulls back to reveal the About page.
 *
 * The channel-change clip supplies the static; everything else (bezel,
 * glass, scanlines, bloom) is CSS so there is no extra payload beyond
 * the 128KB video.
 * ================================================================== */

const CHANNEL_CLIP = "/tv_portfolio_mmw_14/TvChangeChannel_1.mp4";

export function TvTransition() {
  const { transition } = useNav();
  const videoRef = useRef<HTMLVideoElement>(null);

  const on =
    transition.active &&
    transition.phase !== "idle" &&
    transition.href === "/about";

  /* Restart the clip on every trip — a paused-at-the-end video would
     show a frozen frame instead of static on the second visit. */
  useEffect(() => {
    if (!on) return;
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    const p = v.play();
    if (p && typeof p.catch === "function") {
      // Autoplay can be refused; the CSS static underneath still reads.
      p.catch(() => {});
    }
  }, [on, transition.runId]);

  if (!on) return null;

  return (
    <div
      key={transition.runId}
      className={cn("tvt", `tvt--${transition.phase}`)}
      aria-hidden
    >
      <div className="tvt__room" />

      <div className="tvt__set">
        <div className="tvt__shell">
          <div className="tvt__screen">
            <video
              ref={videoRef}
              className="tvt__feed"
              src={CHANNEL_CLIP}
              muted
              playsInline
              preload="auto"
              disablePictureInPicture
            />
            <span className="tvt__static" />
            <span className="tvt__scan" />
            <span className="tvt__glass" />
            {/* The power-on flash: a hairline that snaps open vertically. */}
            <span className="tvt__flick" />
          </div>

          <div className="tvt__bezel">
            <span className="tvt__brand">ABHI—TV</span>
            <span className="tvt__knobs">
              <i />
              <i />
            </span>
          </div>
        </div>

        <span className="tvt__glow" />
      </div>

      <p className="tvt__cue">
        <span>CH 02</span>
        <em>{transition.label || "About"}</em>
      </p>
    </div>
  );
}
