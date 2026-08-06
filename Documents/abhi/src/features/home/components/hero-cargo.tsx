"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFlight } from "@/features/home/components/flight-context";
import { IdCard } from "@/features/home/components/id-card";

/* ================================================================== *
 * Hero cargo
 *
 * Desktop: ID card hitched to the plane. Mobile: no card — the plane
 * flies alone so the hero stays clear.
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

  /* Phone: keep the plane, drop the credential. */
  if (mobileHang) return null;

  if (!flight) {
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
