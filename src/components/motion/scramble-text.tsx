"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\|<>*";

type ScrambleTextProps = {
  children: string;
  className?: string;
  /** ms each character spends scrambling before locking in. */
  speed?: number;
  /** Re-run the scramble whenever the element is hovered. */
  onHover?: boolean;
};

/**
 * Decodes text one character at a time, cycling random glyphs until each
 * position locks. Used for labels and eyebrows, not long-form copy.
 */
export function ScrambleText({
  children,
  className,
  speed = 34,
  onHover = true,
}: ScrambleTextProps) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(children);
  const frame = useRef<number | null>(null);
  const start = useRef(0);

  const stop = useCallback(() => {
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);

  const run = useCallback(() => {
    if (reduced) return;
    stop();
    start.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start.current;
      const locked = Math.floor(elapsed / speed);

      if (locked >= children.length) {
        setDisplay(children);
        frame.current = null;
        return;
      }

      let out = "";
      for (let i = 0; i < children.length; i += 1) {
        if (i < locked || children[i] === " ") out += children[i];
        else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      setDisplay(out);
      frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
  }, [children, speed, reduced, stop]);

  useEffect(() => stop, [stop]);

  // Reset the readout when the label itself changes, adjusting during render
  // rather than in an effect so there's no flash of the stale string.
  const [prevChildren, setPrevChildren] = useState(children);
  if (prevChildren !== children) {
    setPrevChildren(children);
    setDisplay(children);
  }

  return (
    <span
      className={cn("tabular-nums", className)}
      onMouseEnter={onHover ? run : undefined}
      aria-label={children}
    >
      <span aria-hidden>{display}</span>
    </span>
  );
}
