"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { useInView } from "@/hooks/use-in-view";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Direction the content travels in from. */
  from?: "up" | "down" | "left" | "right" | "none";
  /**
   * Fire on mount (hero / above-the-fold). Skips IntersectionObserver so
   * content never stays stuck at opacity 0.
   */
  immediate?: boolean;
};

/** Generic fade + slide reveal for blocks that aren't text. */
export function Reveal({
  children,
  className,
  delay = 0,
  from = "up",
  immediate = false,
}: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.12 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!immediate) return;
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, [immediate]);

  const show = immediate ? mounted : inView;

  return (
    <div
      ref={immediate ? undefined : ref}
      className={cn("reveal", `reveal--${from}`, show && "is-in", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
