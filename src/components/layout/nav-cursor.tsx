"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useNav } from "@/components/layout/nav-provider";

export function NavCursor() {
  const { cursorExpanded } = useNav();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [finePointer, setFinePointer] = useState(false);
  const pos = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setFinePointer(mq.matches && !reduce.matches);
    update();
    mq.addEventListener("change", update);
    reduce.addEventListener("change", update);
    return () => {
      mq.removeEventListener("change", update);
      reduce.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!finePointer) {
      document.body.classList.remove("has-nav-cursor");
      return;
    }

    document.body.classList.add("has-nav-cursor");

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      setVisible(true);
      if (raf.current == null) {
        raf.current = requestAnimationFrame(() => {
          if (ref.current) {
            ref.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
          }
          raf.current = null;
        });
      }
    };

    const onLeave = () => setVisible(false);

    window.addEventListener("mousemove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      document.body.classList.remove("has-nav-cursor");
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [finePointer]);

  if (!finePointer) return null;

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        "nav-cursor",
        cursorExpanded && "nav-cursor--expanded",
        !visible && "nav-cursor--hidden",
      )}
    />
  );
}
