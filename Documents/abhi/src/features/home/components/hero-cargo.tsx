"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFlight } from "@/features/home/components/flight-context";
import { IdCard } from "@/features/home/components/id-card";

/* ================================================================== *
 * Hero cargo
 *
 * The ID card, hitched to the plane that flies the page. The plane is
 * fixed to the viewport and lives outside the hero; the card's rope is
 * solved in its own stage box, so this converts between the two and
 * freezes the anchor the moment the plane lets go — the card then just
 * hangs where it was dropped and slides out of frame with the hero.
 * ================================================================== */

type Size = { w: number; h: number };

export function HeroCargo() {
  const flight = useFlight();
  const markRef = useRef<HTMLSpanElement>(null);
  /** Document offset of the card's stage box. */
  const origin = useRef({ x: 0, y: 0 });
  const released = useRef<{ x: number; y: number } | null>(null);
  const [mobileHang, setMobileHang] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    const sync = () => setMobileHang(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const mark = markRef.current;
    if (!mark) return;

    const measure = () => {
      const rect = mark.getBoundingClientRect();
      origin.current = {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
      };
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(mark);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const anchor = useCallback(
    (stage: Size) => {
      const hitch = flight?.get();
      if (!hitch?.ready) return { x: stage.w * 0.8, y: stage.h * 0.3 };

      if (hitch.carrying) {
        // Scrolling back up hands the card to the plane again.
        released.current = null;
        return {
          x: hitch.x - origin.current.x,
          y: hitch.y - origin.current.y,
        };
      }

      released.current ??= {
        x: hitch.x - origin.current.x,
        y: hitch.y - origin.current.y,
      };
      return released.current;
    },
    [flight],
  );

  /** Short strap — the card rides just under the plane, not the ceiling. */
  const ropeLength = useCallback(
    (stage: Size) => Math.max(96, Math.min(190, stage.h * 0.15)),
    [],
  );

  // Phone: hang inside the in-flow badge slot — the plane is hidden there.
  // No flight context: same ceiling hang as the pre-carrier card.
  //
  // The card's floor size (176x246, from IdCard's narrow-mode clamp) is
  // taller than the reserved slot itself, so anchor + rope are tuned
  // together to rest the card as high as the swing allows — short of
  // that it bleeds under the next section's opaque background, since
  // that section is a later DOM sibling of the hero, not a descendant
  // overflow-y can hold back.
  if (!flight || mobileHang) {
    return (
      <IdCard
        anchor={(stage, card) => ({ x: stage.w * 0.5, y: -(card.h * 0.3) })}
        ropeLength={() => 62}
      />
    );
  }

  return (
    <>
      <span ref={markRef} className="hero-cargo-mark" aria-hidden />
      <IdCard carried anchor={anchor} ropeLength={ropeLength} />
    </>
  );
}
