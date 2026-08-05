"use client";

/* ================================================================== *
 * Ink plate — a still that PRINTS rather than fades.
 *
 * Four ink ghosts (C, M, Y, K) fly in on a stagger and register, then
 * the full-colour photo resolves over them as they drop away. Each
 * ghost is a solid ink field with the grayscale image screened over
 * it, so light areas of the photo lift to bare paper and dark areas
 * hold ink — which is exactly how a plate lays down.
 *
 * `printKey` remounts the stack to replay the build.
 * ================================================================== */

const GHOSTS = ["c", "m", "y", "k"] as const;

export function HeroInkPlate({
  src,
  alt,
  printKey,
  reduced,
}: {
  src: string;
  alt: string;
  printKey: string | number;
  reduced: boolean;
}) {
  return (
    <figure className="ip" key={printKey}>
      <span className="ip__sheet" aria-hidden />

      {/* Ink passes — decorative; the real image carries the alt text. */}
      {reduced
        ? null
        : GHOSTS.map((g) => (
            <span key={g} className={`ip__plate ip__plate--${g}`} aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" draggable={false} />
            </span>
          ))}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={`ip__full${reduced ? " is-instant" : ""}`}
        src={src}
        alt={alt}
        draggable={false}
      />

      <span className="ip__trim" aria-hidden />
    </figure>
  );
}
