"use client";

import { useId } from "react";

/* ================================================================== *
 * Paper plane — shared silhouette
 *
 * One folded dart drawn as flat polygons so the page glider is the
 * same object at any size. Purely presentational: no state, no effects,
 * tones come from CSS vars.
 *
 * Built as a proper multi-fold dart rather than a four-facet blank: a
 * spine ridge that catches the light, two wing facets on a gradient
 * sweep (so the light appears to graze the fold instead of sitting
 * flat), a keel, a small aft flap where the underside folds under, a
 * nose made of two facets meeting at a true point, and a tail tip with
 * its own highlight so the back of the plane reads as folded, not cut
 * off flat.
 * ================================================================== */

export const PLANE_VIEWBOX = { w: 120, h: 84 } as const;

type PaperPlaneProps = {
  className?: string;
};

export function PaperPlane({ className }: PaperPlaneProps) {
  // Unique per instance so multiple planes on one page never fight over the
  // same <linearGradient> id.
  const uid = useId();
  const gFar = `pp-far-${uid}`;
  const gNear = `pp-near-${uid}`;
  const gNose = `pp-nose-${uid}`;

  return (
    <svg
      className={className ? `paper-plane ${className}` : "paper-plane"}
      viewBox={`0 0 ${PLANE_VIEWBOX.w} ${PLANE_VIEWBOX.h}`}
      fill="none"
      aria-hidden
      focusable="false"
    >
      <defs>
        {/* Light grazes each fold at a different angle, so flat colour reads
            as a crease rather than a sticker. */}
        <linearGradient id={gFar} x1="5%" y1="0%" x2="95%" y2="100%">
          <stop offset="0%" style={{ stopColor: "var(--pp-light)" }} />
          <stop offset="100%" style={{ stopColor: "var(--pp-mid)" }} />
        </linearGradient>
        <linearGradient id={gNear} x1="0%" y1="10%" x2="90%" y2="100%">
          <stop offset="0%" style={{ stopColor: "var(--pp-mid)" }} />
          <stop offset="100%" style={{ stopColor: "var(--pp-shade)" }} />
        </linearGradient>
        <linearGradient id={gNose} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "var(--pp-light)" }} />
          <stop offset="100%" style={{ stopColor: "var(--pp-mid)" }} />
        </linearGradient>
      </defs>

      {/* Far wing — catches the light, gradient sweep along the fold */}
      <polygon
        className="paper-plane__face paper-plane__face--far"
        points="117,31 5,3 41,43"
        fill={`url(#${gFar})`}
      />

      {/* Near wing — the lower facet, gradient runs into shadow at the tip */}
      <polygon
        className="paper-plane__face paper-plane__face--near"
        points="117,31 41,43 13,73"
        fill={`url(#${gNear})`}
      />

      {/* Aft flap — the small underfold where the tail paper turns under */}
      <polygon
        className="paper-plane__face paper-plane__face--flap"
        points="41,43 26,50 19,66 13,73"
      />

      {/* Keel sliver between the wings, where the fold turns away */}
      <polygon className="paper-plane__face paper-plane__face--keel" points="41,43 13,73 26,50" />

      {/* Nose — two facets meeting at a true point, not a blunt wedge */}
      <polygon
        className="paper-plane__face paper-plane__face--nose"
        points="117,31 79,24 83,37"
        fill={`url(#${gNose})`}
      />
      <polygon
        className="paper-plane__face paper-plane__face--nose-under"
        points="117,31 83,37 90,42"
      />

      {/* Spine ridge — a thin bright sliver riding the top crease */}
      <polygon
        className="paper-plane__face paper-plane__face--ridge"
        points="116,29.5 43,41 41,43 45,40.5 115,29"
      />

      {/* Tail tip — a small highlight facet so the back reads as a fold
          rather than a flat cut edge. Sits entirely inside the far-wing
          silhouette, so it can only ever add definition, never overflow it. */}
      <polygon
        className="paper-plane__face paper-plane__face--tail-tip"
        points="24,24 5,3 19,16"
      />

      {/* Creases: spine fold, wing fold, tail flap fold, tail tip fold */}
      <path className="paper-plane__crease" d="M117 31 L41 43" />
      <path className="paper-plane__crease paper-plane__crease--soft" d="M41 43 L24 24" />
      <path className="paper-plane__crease paper-plane__crease--soft" d="M41 43 L26 50" />
      <path className="paper-plane__crease paper-plane__crease--soft" d="M24 24 L5 3" />
    </svg>
  );
}
